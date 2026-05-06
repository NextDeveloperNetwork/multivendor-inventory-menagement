'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

async function getSystemCurrencySymbol() {
    const currency = await prisma.currency.findFirst({ where: { isBase: true } });
    return currency?.symbol || '$';
}

function serializableUser(u: any) {
    if (!u) return null;
    return {
        ...u,
        address: u.address || null,
        postalBaseFee: u.postalBaseFee ? Number(u.postalBaseFee) : 0,
        postalManagerCut: u.postalManagerCut ? Number(u.postalManagerCut) : 0,
        postalActiveRoute: u.postalActiveRoute || null
    };
}

function serializableShipment(s: any) {
    if (!s) return null;
    return {
        ...s,
        codAmount: s.codAmount ? Number(s.codAmount) : 0,
        shippingFee: s.shippingFee ? Number(s.shippingFee) : 0,
        managerCut: s.managerCut ? Number(s.managerCut) : 0,
        adminCut: s.adminCut ? Number(s.adminCut) : 0,
        sender: s.sender ? serializableUser(s.sender) : null,
        originManager: s.originManager ? serializableUser(s.originManager) : null,
        destinationManager: s.destinationManager ? serializableUser(s.destinationManager) : null
    };
}

export async function getPostalUsers() {
    try {
        const [managers, pendingManagers, clients, relations, currencySymbol, shipments, settlements] = await Promise.all([
            (prisma.user as any).findMany({
                where: { role: 'POSTAL_MANAGER', isApproved: true },
                include: { managedClients: { include: { client: true } } }
            }),
            (prisma.user as any).findMany({
                where: { role: 'POSTAL_MANAGER', isApproved: false }
            }),
            prisma.user.findMany({
                where: { role: 'POSTAL_CLIENT' },
                include: { managerRelations: { include: { manager: true } } }
            }),
            prisma.postalRelation.findMany({
                include: { manager: true, client: true }
            }),
            getSystemCurrencySymbol(),
            (prisma as any).postalShipment.findMany({
                where: { status: 'DELIVERED' }
            }),
            (prisma as any).postalSettlement.findMany({
                include: { fromUser: true, toUser: true, shipment: true },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Global Economics
        const platformRevenue = shipments.reduce((acc: number, s: any) => acc + Number(s.adminCut), 0);
        const globalMerchantDebt = shipments.filter((s: any) => s.hasCod && s.paymentStatus === 'UNPAID').reduce((acc: number, s: any) => {
            return acc + (Number(s.codAmount) - Number(s.shippingFee));
        }, 0);

        return { 
            success: true, 
            managers: (managers || []).map(serializableUser), 
            pendingManagers: (pendingManagers || []).map(serializableUser), 
            clients: (clients || []).map(serializableUser), 
            relations: (relations || []).map((r: any) => ({
                ...r,
                manager: serializableUser(r.manager),
                client: serializableUser(r.client)
            })),
            settlements: (settlements || []).map((st: any) => ({
                ...st,
                amount: Number(st.amount),
                fromUser: serializableUser(st.fromUser),
                toUser: serializableUser(st.toUser),
                shipment: serializableShipment(st.shipment)
            })),
            currencySymbol,
            economics: { platformRevenue, globalMerchantDebt }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function approvePostalManager(userId: string) {
    try {
        await (prisma.user as any).update({
            where: { id: userId },
            data: { isApproved: true }
        });
        revalidatePath('/admin/postal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updatePostalManagerFees(userId: string, data: { postalBaseFee: number, postalManagerCut: number }) {
    try {
        await (prisma.user as any).update({
            where: { id: userId },
            data: {
                postalBaseFee: data.postalBaseFee,
                postalManagerCut: data.postalManagerCut,
                address: (data as any).address || undefined
            }
        });
        revalidatePath('/admin/postal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createPostalUser(data: { name: string; email: string; password?: string; role: 'POSTAL_MANAGER' | 'POSTAL_CLIENT' }) {
    try {
        const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: data.role,
                address: (data as any).address || null
            } as any
        });
        revalidatePath('/admin/postal');
        return { success: true, user: serializableUser(user) };
    } catch (error: any) {
        return { success: false, error: 'Email already exists or failed to create user.' };
    }
}

export async function deletePostalUser(userId: string) {
    try {
        await prisma.user.delete({ where: { id: userId } });
        revalidatePath('/admin/postal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function appendPostalRelation(managerId: string, clientId: string) {
    try {
        const rel = await prisma.postalRelation.create({
            data: {
                managerId,
                clientId
            }
        });
        revalidatePath('/admin/postal');
        return { success: true, relation: rel };
    } catch (error: any) {
        return { success: false, error: 'Relation may already exist or failed.' };
    }
}

export async function removePostalRelation(relationId: string) {
    try {
        await prisma.postalRelation.delete({ where: { id: relationId } });
        revalidatePath('/admin/postal');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getSortingCenterShipments() {
    try {
        const [shipments, managers, transporters, currencySymbol] = await Promise.all([
            (prisma.postalShipment as any).findMany({
                where: { status: 'AT_SORTING_CENTER' },
                include: { sender: true, originManager: true, destinationManager: true }
            }),
            (prisma.user as any).findMany({
                where: { role: 'POSTAL_MANAGER', isApproved: true }
            }),
            (prisma.user as any).findMany({
                where: { role: 'POSTAL_TRANSPORTER' }
            }),
            getSystemCurrencySymbol()
        ]);

        return { 
            success: true, 
            shipments: (shipments || []).map(serializableShipment), 
            managers: (managers || []).map(serializableUser),
            transporters: (transporters || []).map(serializableUser),
            currencySymbol
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function assignDestinationManager(shipmentId: string, managerId: string) {
    try {
        await (prisma.postalShipment as any).update({
            where: { id: shipmentId },
            data: {
                destinationManagerId: managerId,
                status: 'IN_TRANSIT_TO_DESTINATION' 
            }
        });
        revalidatePath('/admin/postal/sorting');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
