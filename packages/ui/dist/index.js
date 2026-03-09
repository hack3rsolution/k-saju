"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Button: () => Button,
  Card: () => Card,
  Input: () => Input,
  SectionHeader: () => SectionHeader
});
module.exports = __toCommonJS(index_exports);

// src/components/Button.tsx
var import_react = __toESM(require("react"));
var Button = ({
  children,
  onClick,
  onPress,
  variant = "primary",
  disabled = false,
  className = "",
  style
}) => {
  const handlePress = () => {
    if (onClick) onClick();
    if (onPress) onPress();
  };
  return /* @__PURE__ */ import_react.default.createElement(
    "button",
    {
      onClick: disabled ? void 0 : handlePress,
      className,
      style,
      disabled
    },
    children
  );
};

// src/components/Input.tsx
var import_react2 = __toESM(require("react"));
var Input = ({ value, onChange, placeholder, type = "text", disabled = false, className = "", style }) => {
  return /* @__PURE__ */ import_react2.default.createElement(
    "input",
    {
      type,
      value,
      onChange: (e) => onChange?.(e.target.value),
      placeholder,
      disabled,
      className,
      style
    }
  );
};

// src/components/Card.tsx
var import_react3 = __toESM(require("react"));
var paddingMap = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6"
};
var shadowMap = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg"
};
var Card = ({
  padding = "md",
  shadow = "sm",
  className = "",
  children,
  ...rest
}) => {
  return /* @__PURE__ */ import_react3.default.createElement(
    "div",
    {
      className: [
        "rounded-lg bg-white border border-gray-100",
        paddingMap[padding],
        shadowMap[shadow],
        className
      ].filter(Boolean).join(" "),
      ...rest
    },
    children
  );
};

// src/components/SectionHeader.tsx
var import_react4 = __toESM(require("react"));
var SectionHeader = ({
  title,
  subtitle,
  align = "left",
  className = ""
}) => {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: ["space-y-2", alignClass, className].filter(Boolean).join(" ") }, /* @__PURE__ */ import_react4.default.createElement("h2", { className: "text-2xl font-bold tracking-tight" }, title), subtitle && /* @__PURE__ */ import_react4.default.createElement("p", { className: "text-gray-600" }, subtitle));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Button,
  Card,
  Input,
  SectionHeader
});
//# sourceMappingURL=index.js.map