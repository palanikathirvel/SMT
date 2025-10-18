import React from "react";
import myBg from "../../../../../assets/images/bg-1.png";

const InfoCards = ({ myStyle, total, text, children, onClick, clickable = false }) => {
    return (
        <div 
            className={`${myStyle} ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`} 
            style={{ backgroundImage: "url(" + myBg + ")" }}
            onClick={clickable ? onClick : undefined}
        >
            <div className="mb-4 flex items-center justify-between">
                <span className="bg-black bg-opacity-30 p-1 rounded-md">{children}</span>
                <span className=" text-white">
                    <h1>{total}</h1>
                </span>
            </div>
            <div className="flex items-center justify-between text-white">
                <h2>{text}</h2>
                {clickable && (
                    <span className="text-xs opacity-75">Click to view</span>
                )}
            </div>
        </div>
    );
};

export default InfoCards;
