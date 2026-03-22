import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle,
  Cloud,
  Droplets,
  Wind,
  Thermometer,
  Sun,
} from "lucide-react";
import Layout from "@/components/Layout";

const sessions = [
  { name: "Free Practice 1", time: "FRI 11:30", status: "done" },
  { name: "Free Practice 2", time: "FRI 15:00", status: "done" },
  { name: "Free Practice 3", time: "SAT 10:30", status: "upcoming" },
  { name: "Qualifying", time: "SAT 14:00", status: "upcoming" },
  { name: "Race", time: "SUN 14:00", status: "upcoming" },
];

const weatherMetrics = [
  { icon: Thermometer, label: "Track Temp", value: "42°C" },
  { icon: Droplets, label: "Rain", value: "15%" },
  { icon: Wind, label: "Wind", value: "12 km/h" },
  { icon: Cloud, label: "Humidity", value: "58%" },
];

const Schedule = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-2 font-display text-3xl sm:text-4xl">
            SCHEDULE & WEATHER
          </h1>
          <p className="mb-8 text-muted-foreground">
            Italian Grand Prix, Monza 🇮🇹
          </p>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-3 lg:col-span-3">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  className="glass-card flex items-center justify-between p-5 hover-lift"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        session.status === "done"
                          ? "bg-podium-green/20"
                          : "bg-primary/20"
                      }`}
                    >
                      {session.status === "done" ? (
                        <CheckCircle className="h-5 w-5 text-podium-green" />
                      ) : (
                        <Clock className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">{session.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.time}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                      session.status === "done"
                        ? "bg-podium-green/20 text-podium-green"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {session.status}
                  </span>
                </motion.div>
              ))}
            </div>

            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="glass-card p-6 sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-lg">RACE DAY WEATHER</h2>
                  <Sun className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="mb-6 text-center">
                  <span className="font-display text-6xl">24°</span>
                  <span className="ml-1 text-muted-foreground">C</span>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Partly Cloudy
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {weatherMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl bg-muted/50 p-4 text-center"
                    >
                      <metric.icon className="mx-auto mb-2 h-5 w-5 text-secondary" />
                      <div className="text-sm font-semibold">{metric.value}</div>
                      <div className="text-xs text-muted-foreground">
                        {metric.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Schedule;
