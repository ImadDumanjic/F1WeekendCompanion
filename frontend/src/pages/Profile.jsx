import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Save } from "lucide-react";
import Layout from "@/components/Layout";

const Profile = () => {
  const [username, setUsername] = useState("You");
  const [email, setEmail] = useState("fan@f1companion.com");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <Layout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-8 font-display text-3xl sm:text-4xl">PROFILE</h1>

          <div className="glass-card p-6 sm:p-8">
            <div className="mb-8 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setSaved(false);
                  }}
                  className="w-full rounded-xl border border-glass-border bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setSaved(false);
                  }}
                  className="w-full rounded-xl border border-glass-border bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-glass-border bg-muted px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                onClick={handleSave}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm uppercase tracking-wider transition-all ${
                  saved
                    ? "bg-podium-green text-success-foreground"
                    : "bg-primary text-primary-foreground glow-red hover:brightness-110"
                }`}
              >
                <Save className="h-4 w-4" />
                {saved ? "Profile Updated" : "Update Profile"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Profile;
