"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Button = ({ children, className, appName }) => {
    return ((0, jsx_runtime_1.jsx)("button", { className: className, onClick: () => alert(`Hello from your ${appName} app!`), children: children }));
};
exports.Button = Button;
//# sourceMappingURL=button.js.map