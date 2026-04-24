import { motion } from "framer-motion";

export default function StatCard({ title, value, change, changeType, icon: Icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-extrabold mt-2 tracking-tight">{value}</p>
          {change && (
            <p className={`text-xs font-semibold mt-2 ${changeType === "up" ? "text-accent" : "text-destructive"}`}>
              {changeType === "up" ? "↑" : "↓"} {change} vs last week
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </motion.div>
  );
}