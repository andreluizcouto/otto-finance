import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "#000000",
          "--normal-text": "#FFFFFF",
          "--normal-border": "rgba(255,255,255,0.1)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
