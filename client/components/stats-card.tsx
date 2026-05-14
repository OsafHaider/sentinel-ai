"use client";
const StatCard = ({
  title,
  subtitle,
  value,
  icon,
  accentColor = "blue",
  tag,
  isCash = false,
}: {
  title: string;
  subtitle: string;
  value: number | string;
  icon: React.ReactNode;
  accentColor?: string;
  tag: string;
  isCash?: boolean;
}) => {
  const accentClasses = {
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 text-blue-400",
    amber:
      "from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40 text-amber-400",
    rose: "from-rose-500/10 to-rose-500/5 border-rose-500/20 hover:border-rose-500/40 text-rose-400",
    emerald:
      "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400",
    green:
      "from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/40 text-green-400",
  };

  const accentColor_ =
    accentClasses[accentColor as keyof typeof accentClasses] ||
    accentClasses.blue;

  return (
    <div
      className={`group text- bg-linear-to-br ${accentColor_} backdrop-blur-sm border rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-${accentColor}-500/10 cursor-default`}
    >
      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-2.5 rounded-lg bg-${accentColor}-500/10 group-hover:bg-${accentColor}-500/20 transition-colors`}
        >
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-tighter font-semibold px-2.5 py-1 rounded-full bg-slate-700/50">
          {tag}
        </span>
      </div>
      <div>
        <h3 className="text-slate-300 font-medium text-sm mb-0.5">{title}</h3>
        <p className="text-slate-500 text-xs mb-4">{subtitle}</p>
      </div>
      <p
        className={`text-4xl font-bold tabular-nums ${
          isCash
            ? "text-emerald-400"
            : accentColor_.split(" ")[0].replace("text-", "")
        }`}
      >
        {isCash ? `$${value}` : value}
      </p>
    </div>
  );
};
export default StatCard;
