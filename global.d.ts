// types/bluetooth.d.ts

interface Navigator {
    bluetooth: {
        requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
    };
}

interface RequestDeviceOptions {
    filters?: Array<{ name?: string; namePrefix?: string; services?: number[] }>;
    optionalServices?: number[];
    acceptAllDevices?: boolean;
}

interface BluetoothDevice {
    gatt?: BluetoothRemoteGATTServer;
    name?: string;
    id: string;
}

interface BluetoothRemoteGATTServer {
    connect(): Promise<BluetoothRemoteGATTServer>;
    getPrimaryService(service: number): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
    getCharacteristic(characteristic: number): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic {
    writeValue(data: ArrayBuffer): Promise<void>;
}
