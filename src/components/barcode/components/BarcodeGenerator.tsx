"use client";

import React, { useEffect, useState } from "react";
import Barcode from "react-barcode";

interface BarcodeGeneratorProps {
    value: string;
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    background?: string;
    lineColor?: string;
    textAlign?: string;
    textPosition?: string;
    textMargin?: number;
}

export const BarcodeGenerator = ({
    value,
    format = "CODE128",
    width = 2,
    height = 100,
    displayValue = true,
    fontSize = 20,
    margin = 10,
    background = "#ffffff",
    lineColor = "#000000",
    textAlign = "center",
    textPosition = "bottom",
    textMargin = 2,
}: BarcodeGeneratorProps) => {
    // Basic validation to prevent crash on empty value if library doesn't handle it
    if (!value) {
        return <div className="flex items-center justify-center p-4 text-gray-400 border-2 border-dashed rounded-md w-full h-full">Enter text to generate barcode</div>;
    }

    return (
        <div className="flex justify-center items-center overflow-hidden w-full h-full bg-white">
            <Barcode
                value={value}
                format={format as any}
                width={width}
                height={height}
                displayValue={displayValue}
                fontSize={fontSize}
                margin={margin}
                background={background}
                lineColor={lineColor}
                textAlign={textAlign as any}
                textPosition={textPosition as any}
                textMargin={textMargin}
            />
        </div>
    );
};
