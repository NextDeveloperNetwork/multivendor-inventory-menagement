'use client';

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

const COLORS = [
    '#2563eb',
    '#16a34a',
    '#f59e0b',
    '#dc2626',
    '#7c3aed',
    '#0891b2',
];

export default function ShopPerformanceChart({
    data,
}: {
    data: {
        name: string;
        revenue: number;
        percentage: number;
    }[];
}) {
    return (
        <div className="w-full h-[280px]">
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="percentage"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                    >
                        {data.map((_, index) => (
                            <Cell
                                key={index}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>

                    <Tooltip
                        formatter={(value: number | undefined) =>
                            value !== undefined ? `${value.toFixed(1)}%` : ''
                        }
                    />

                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
