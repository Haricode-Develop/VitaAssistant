import { ReactNode } from "react";

type BadgeColor = "primary" | "accent" | "gray";

type Props = {
    children: ReactNode;
    color?: BadgeColor;
};

const colorClasses: Record<BadgeColor, string> = {
    primary: "bg-blue-600/10 text-blue-700 border-blue-600/20",
    accent: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    gray: "bg-slate-500/10 text-slate-700 border-slate-500/20"
};

export default function Badge({ children, color = "primary" }: Props) {
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs border ${colorClasses[color]}`}>
      {children}
    </span>
    );
}
