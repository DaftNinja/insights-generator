import { Switch, Route } from "wouter";
import { Home } from "@/pages/Home";
import { Reports } from "@/pages/Reports";
import { Dashboard } from "@/pages/Dashboard";
import { Mission } from "@/pages/Mission";
import { Presentation } from "@/pages/Presentation";
import { Batch } from "@/pages/Batch";
import { Demo } from "@/pages/Demo";
import { AuditLog } from "@/pages/AuditLog";

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)] text-center px-6">
      <div className="font-mono text-8xl font-bold text-blue-200 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Page not found</h1>
      <p className="text-[var(--text-secondary)] mb-8">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary">Go home</a>
    </div>
  );
}

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/reports" component={Reports} />
      <Route path="/reports/:slug" component={Dashboard} />
      <Route path="/mission" component={Mission} />
      <Route path="/presentation" component={Presentation} />
      <Route path="/batch" component={Batch} />
      <Route path="/demo" component={Demo} />
      <Route path="/audit-log" component={AuditLog} />
      <Route component={NotFound} />
    </Switch>
  );
}
