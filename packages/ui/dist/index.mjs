// src/components/Button.tsx
import React from "react";
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
  return /* @__PURE__ */ React.createElement(
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
import React2 from "react";
var Input = ({ value, onChange, placeholder, type = "text", disabled = false, className = "", style }) => {
  return /* @__PURE__ */ React2.createElement(
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
import React3 from "react";
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
  return /* @__PURE__ */ React3.createElement(
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
import React4 from "react";
var SectionHeader = ({
  title,
  subtitle,
  align = "left",
  className = ""
}) => {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return /* @__PURE__ */ React4.createElement("div", { className: ["space-y-2", alignClass, className].filter(Boolean).join(" ") }, /* @__PURE__ */ React4.createElement("h2", { className: "text-2xl font-bold tracking-tight" }, title), subtitle && /* @__PURE__ */ React4.createElement("p", { className: "text-gray-600" }, subtitle));
};
export {
  Button,
  Card,
  Input,
  SectionHeader
};
//# sourceMappingURL=index.mjs.map