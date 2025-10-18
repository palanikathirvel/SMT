import React from "react";

const ModalOverlay = ({ children, nodeRef }) => {
    return (
        <div
            ref={nodeRef}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
            {children}
        </div>
    );
};

export default ModalOverlay;
