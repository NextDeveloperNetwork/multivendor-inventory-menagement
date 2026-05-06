'use server';

import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

async function getSystemCurrencySymbol() {
    const currency = await prisma.currency.findFirst({ where: { isBase: true } });
    return currency?.symbol || '$';
}

function generateTrackingNumber() {
    return 'RX' + Math.floor(100000000 + Math.random() * 900000000) + 'AL';
}

function serializableUser(u: any) {
    if (!u) return null;
    return {
        ...u,
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

export async function getClientShipments() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const [shipments, rel, currencySymbol] = await Promise.all([
            (prisma as any).postalShipment.findMany({
                where: { senderId: (session.user as any).id },
                orderBy: { createdAt: 'desc' },
                include: { originManager: true }
            }),
            (prisma as any).postalRelation.findFirst({
                where: { clientId: (session.user as any).id },
                include: { manager: true }
            }),
            getSystemCurrencySymbol()
        ]);
        
        const settlements = await (prisma as any).postalSettlement.findMany({
            where: { toUserId: (session.user as any).id },
            include: { fromUser: true, shipment: true },
            orderBy: { createdAt: 'desc' }
        });

        const totalOutstanding = (shipments || [])
            .filter((s: any) => s.status === 'DELIVERED' && s.hasCod && s.paymentStatus === 'UNPAID')
            .reduce((acc: number, s: any) => acc + (Number(s.codAmount) - Number(s.shippingFee)), 0);
        
        return { 
            success: true, 
            shipments: (shipments || []).map(serializableShipment), 
            myManager: serializableUser(rel?.manager),
            settlements: settlements.map((st: any) => ({
                ...st,
                amount: Number(st.amount),
                fromUser: serializableUser(st.fromUser),
                shipment: serializableShipment(st.shipment)
            })),
            totalOutstanding,
            currencySymbol
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createClientShipment(data: { 
    recipientName: string, 
    recipientAddress: string, 
    recipientPhone: string, 
    weight: number, 
    notes: string,
    packageValue: number,
    hasCod: boolean
}) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const rel = await (prisma as any).postalRelation.findFirst({
            where: { clientId: (session.user as any).id },
            include: { manager: true }
        });
        
        const baseFee = rel?.manager?.postalBaseFee || 5;
        const managerCutPercent = rel?.manager?.postalManagerCut || 0;
        
        const calcCost = Number(baseFee) + (Number(data.weight) * 2);
        const codAmount = data.hasCod ? (Number(data.packageValue) + calcCost) : 0;
        const managerCut = (calcCost * Number(managerCutPercent)) / 100;
        const adminCut = calcCost - managerCut;

        const s = await (prisma as any).postalShipment.create({
            data: {
                trackingNumber: generateTrackingNumber(),
                senderId: (session.user as any).id,
                originManagerId: rel?.managerId || null,
                recipientName: data.recipientName,
                recipientAddress: data.recipientAddress,
                recipientPhone: data.recipientPhone,
                weight: Number(data.weight),
                shippingFee: calcCost,
                codAmount: codAmount,
                hasCod: data.hasCod,
                managerCut: managerCut,
                adminCut: adminCut,
                notes: data.notes
            }
        });
        revalidatePath('/postal-client');
        return { success: true, shipment: serializableShipment(s) };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getManagerDashboard() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const [clientsObj, currencySymbol] = await Promise.all([
            (prisma as any).postalRelation.findMany({
                where: { managerId: (session.user as any).id },
                include: { client: true }
            }),
            getSystemCurrencySymbol()
        ]);

        const clientIds = clientsObj.map((c: any) => c.clientId);

        const shipments = await (prisma as any).postalShipment.findMany({
            where: {
                OR: [
                    { originManagerId: (session.user as any).id },
                    { destinationManagerId: (session.user as any).id },
                    { senderId: { in: clientIds } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: { sender: true, originManager: true, destinationManager: true }
        });

        // Economic Logic
        const delivered = shipments.filter((s: any) => s.status === 'DELIVERED');
        const netProfit = delivered.reduce((acc: number, s: any) => acc + Number(s.managerCut), 0);
        
        // Calculate merchant debt specifically for UNPAID COD
        const merchantDebt = delivered.filter((s: any) => s.hasCod && s.paymentStatus === 'UNPAID').reduce((acc: number, s: any) => {
            return acc + (Number(s.codAmount) - Number(s.shippingFee));
        }, 0);

        const clientsWithDebt = clientsObj.map((c: any) => {
            const clientShipments = delivered.filter((s: any) => s.senderId === c.clientId && s.hasCod && s.paymentStatus === 'UNPAID');
            const totalOwed = clientShipments.reduce((acc: number, s: any) => acc + (Number(s.codAmount) - Number(s.shippingFee)), 0);
            return {
                ...serializableUser(c.client),
                outstandingCod: totalOwed
            };
        });

        const pendingSettlements = await (prisma as any).postalSettlement.findMany({
            where: { fromUserId: (session.user as any).id, status: 'PENDING' },
            include: { toUser: true, shipment: true }
        });

        return { 
            success: true, 
            clients: clientsWithDebt, 
            shipments: (shipments || []).map(serializableShipment),
            pendingSettlements: pendingSettlements.map((st: any) => ({
                ...st,
                amount: Number(st.amount),
                toUser: serializableUser(st.toUser),
                shipment: serializableShipment(st.shipment)
            })),
            currencySymbol,
            economics: { netProfit, merchantDebt }
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateShipmentStatus(shipmentId: string, status: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const existing = await (prisma as any).postalShipment.findUnique({ where: { id: shipmentId } });
        if (!existing) return { success: false, error: 'Shipment not found' };

        await (prisma as any).postalShipment.update({
            where: { id: shipmentId },
            data: { status }
        });
        revalidatePath('/postal-manager');
        revalidatePath('/postal-transporter');
        revalidatePath('/admin/postal/sorting');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createClientAccount(data: { name: string, email: string, password?: string }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const hashedPassword = await bcrypt.hash(data.password || 'password123', 10);
        const user = await (prisma.user as any).create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                role: 'POSTAL_CLIENT'
            }
        });

        await (prisma as any).postalRelation.create({
            data: {
                managerId: (session.user as any).id,
                clientId: user.id
            }
        });

        revalidatePath('/postal-manager');
        return { success: true, client: serializableUser(user) };
    } catch (e: any) {
        return { success: false, error: 'Email already exists or failed to create client.' };
    }
}

export async function getTransporterShipments() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const [shipments, transporter, currencySymbol] = await Promise.all([
            (prisma as any).postalShipment.findMany({
                where: {
                    OR: [
                        { status: 'PENDING_PICKUP' },
                        { status: 'AT_SORTING_CENTER' }, // Added to show sorting center packages
                        { status: 'IN_TRANSIT_TO_SORTING' },
                        { status: 'IN_TRANSIT_TO_DESTINATION' }
                    ]
                },
                include: {
                    originManager: true,
                    destinationManager: true
                },
                orderBy: { updatedAt: 'asc' }
            }),
            (prisma.user as any).findUnique({ where: { id: (session.user as any).id } }),
            getSystemCurrencySymbol()
        ]);
        return { 
            success: true, 
            shipments: (shipments || []).map(serializableShipment), 
            transporter: serializableUser(transporter),
            currencySymbol 
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
export async function getTransporters() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const transporters = await (prisma.user as any).findMany({
            where: { role: 'POSTAL_TRANSPORTER' },
            select: { id: true, name: true, email: true, postalActiveRoute: true }
        });
        return { success: true, transporters };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function assignShipmentsToTransporter(shipmentIds: string[], transporterId: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        await (prisma as any).postalShipment.updateMany({
            where: { id: { in: shipmentIds } },
            data: { 
                transporterId,
                status: 'ASSIGNED_FOR_PICKUP'
            }
        });
        revalidatePath('/postal-manager');
        revalidatePath('/postal-transporter');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function transporterAcceptShipment(trackingNumber: string, expectedDestinationAddress?: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const shipment = await (prisma as any).postalShipment.findFirst({
            where: { 
                trackingNumber,
                transporterId: (session.user as any).id,
                status: 'ASSIGNED_FOR_PICKUP'
            },
            include: { destinationManager: true }
        });

        if (!shipment) return { success: false, error: 'Manifest not found or not assigned for pickup.' };

        if (expectedDestinationAddress && shipment.destinationManager?.address !== expectedDestinationAddress) {
            return { success: false, error: `Route Mismatch: Package bound for ${shipment.destinationManager?.address || 'Unknown Hub'}` };
        }

        await (prisma as any).postalShipment.update({
            where: { id: shipment.id },
            data: { status: 'IN_TRANSIT_TO_SORTING' }
        });

        revalidatePath('/postal-transporter');
        revalidatePath('/postal-manager');
        return { success: true, shipment: serializableShipment(shipment) };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function offloadAtHub(shipmentId: string) {
    try {
        await (prisma as any).postalShipment.update({
            where: { id: shipmentId },
            data: { status: 'ARRIVED_AT_HUB' }
        });
        revalidatePath('/postal-transporter');
        revalidatePath('/postal-manager');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function finalizeManagerDelivery(shipmentId: string) {
    try {
        await (prisma as any).postalShipment.update({
            where: { id: shipmentId },
            data: { status: 'DELIVERED', paymentStatus: 'UNPAID' }
        });
        revalidatePath('/postal-manager');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createSettlement(shipmentId: string, fromUserId: string, toUserId: string, amount: number) {
    try {
        await (prisma as any).postalSettlement.create({
            data: {
                shipmentId,
                fromUserId,
                toUserId,
                amount,
                type: 'COD_SETTLEMENT',
                status: 'PENDING'
            }
        });
        
        await (prisma as any).postalShipment.update({
            where: { id: shipmentId },
            data: { paymentStatus: 'PENDING_ACCEPTANCE' }
        });

        revalidatePath('/postal-manager');
        revalidatePath('/postal-client');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function acceptSettlement(settlementId: string) {
    try {
        const settlement = await (prisma as any).postalSettlement.update({
            where: { id: settlementId },
            data: { status: 'ACCEPTED' },
            include: { shipment: true }
        });

        if (settlement.shipmentId) {
            await (prisma as any).postalShipment.update({
                where: { id: settlement.shipmentId },
                data: { paymentStatus: 'PAID' }
            });
        }

        revalidatePath('/postal-client');
        revalidatePath('/postal-manager');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function setTransporterRoute(transporterId: string, route: string) {
    try {
        await (prisma.user as any).update({
            where: { id: transporterId },
            data: { postalActiveRoute: route }
        });
        revalidatePath('/postal-manager');
        revalidatePath('/admin/postal/sorting');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function transporterScanAndAutoPickup(trackingNumber: string) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    try {
        const [transporter, shipment] = await Promise.all([
            (prisma.user as any).findUnique({ where: { id: session.user.id } }),
            (prisma as any).postalShipment.findFirst({
                where: { trackingNumber },
                include: { destinationManager: true }
            })
        ]);

        if (!transporter) return { success: false, error: 'Transporter not found' };
        if (!shipment) return { success: false, error: 'Manifest not found.' };
        if (!transporter.postalActiveRoute) return { success: false, error: 'Declar your route first.' };

        // Logic check: if package is at sorting center or pending pickup
        const validStatuses = ['PENDING_PICKUP', 'AT_SORTING_CENTER', 'ASSIGNED_FOR_PICKUP'];
        if (!validStatuses.includes(shipment.status)) {
            return { success: false, error: `Package status is ${shipment.status}. Cannot pick up.` };
        }

        // Match route (check destination manager hub address or recipient address)
        const destHub = shipment.destinationManager?.address || '';
        const destAddr = shipment.recipientAddress || '';
        const currentRoute = transporter.postalActiveRoute.toLowerCase();

        const matches = destHub.toLowerCase().includes(currentRoute) || 
                       destAddr.toLowerCase().includes(currentRoute);

        if (!matches) {
            return { success: false, error: `Route Mismatch: Package bound for ${destHub || destAddr}. Your route: ${transporter.postalActiveRoute}` };
        }

        // Auto-assign and update status
        await (prisma as any).postalShipment.update({
            where: { id: shipment.id },
            data: { 
                transporterId: transporter.id,
                status: shipment.status === 'AT_SORTING_CENTER' ? 'IN_TRANSIT_TO_DESTINATION' : 'IN_TRANSIT_TO_SORTING'
            }
        });

        revalidatePath('/postal-transporter');
        revalidatePath('/postal-manager');
        revalidatePath('/admin/postal/sorting');
        return { success: true, shipment: serializableShipment(shipment) };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
