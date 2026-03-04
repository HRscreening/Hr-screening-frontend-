import { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Settings2,
  Link2,
  Link2Off,
  Calendar,
  Mail,
  Linkedin,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
  Loader2,
  Ban,
} from "lucide-react";
import axios from "@/axiosConfig"
// ─── Types ────────────────────────────────────────────────────────────────────

type ProviderStatus = "connected" | "disconnected" | "error" | "loading";

interface ConnectedAccount {
  email: string;
  name: string;
  avatarUrl?: string;
  connectedAt: string; // ISO
  scopes: string[];
}

interface Provider {
  id: "google_calendar" | "outlook" | "linkedin";
  name: string;
  description: string;
  status: ProviderStatus;
  account?: ConnectedAccount;
  features: string[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROVIDERS: Provider[] = [
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync events, schedule meetings, detect availability.",
    status: "disconnected",
    features: ["Two-way sync", "Meeting scheduler", "Availability detection"],
  },
  {
    id: "outlook",
    name: "Microsoft Outlook",
    description: "Connect calendar and email for seamless workflow.",
    status: "connected",
    account: {
      email: "alex.johnson@gmail.com",
      name: "Alex Johnson",
      avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=alex",
      connectedAt: "2024-11-12T09:30:00Z",
      scopes: ["Read events", "Write events", "Manage calendars"],
    },
    features: ["Calendar sync", "Email integration", "Teams meetings"],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "Import professional network, connections, and profile.",
    status: "error",
    account: {
      email: "alex.johnson@company.com",
      name: "Alex Johnson",
      avatarUrl: "https://api.dicebear.com/7.x/notionists/svg?seed=linkedin",
      connectedAt: "2024-10-05T14:00:00Z",
      scopes: ["Read profile", "Read connections"],
    },
    features: ["Network import", "Profile sync", "Connection insights"],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const statusConfig: Record<
  ProviderStatus,
  { label: string; icon: React.ReactNode; badge: string }
> = {
  connected: {
    label: "Connected",
    icon: <CheckCircle2 className="w-3 h-3 text-emerald-500" />,
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  },
  disconnected: {
    label: "Not connected",
    icon: <Circle className="w-3 h-3 text-muted-foreground" />,
    badge: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  },
  error: {
    label: "Needs attention",
    icon: <AlertCircle className="w-3 h-3 text-amber-500" />,
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  },
  loading: {
    label: "Connecting…",
    icon: <Loader2 className="w-3 h-3 text-primary animate-spin" />,
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  },
};

const providerIcon: Record<Provider["id"], React.ReactNode> = {
  google_calendar: <Calendar className="w-4 h-4" />,
  outlook: <Mail className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
};

// ─── Detail Dialog ────────────────────────────────────────────────────────────

interface DetailDialogProps {
  provider: Provider | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDisconnect: (id: Provider["id"]) => void;
}

const DetailDialog = ({
  provider,
  open,
  onOpenChange,
  onDisconnect,
}: DetailDialogProps) => {
  if (!provider) return null;
  const isConnected = provider.status === "connected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="p-1.5 rounded-md bg-muted shrink-0">
              {providerIcon[provider.id]}
            </div>
            <div>
              <DialogTitle className="text-sm">{provider.name}</DialogTitle>
              <div className="flex items-center gap-1 mt-0.5">
                {statusConfig[provider.status].icon}
                <span className="text-[10px] text-muted-foreground">
                  {statusConfig[provider.status].label}
                </span>
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs">
            {provider.description}
          </DialogDescription>
        </DialogHeader>

        {provider.account && (
          <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Avatar className="w-8 h-8">
                <AvatarImage src={provider.account.avatarUrl} />
                <AvatarFallback className="text-[10px]">
                  {provider.account.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium">{provider.account.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {provider.account.email}
                </p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1">
                {provider.account.scopes.map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px] h-4 px-1.5">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Connected {formatDate(provider.account.connectedAt)}
            </p>
          </div>
        )}

        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-medium">
            Features
          </p>
          <div className="space-y-1.5">
            {provider.features.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isConnected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <Link2Off className="w-3 h-3" />
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect {provider.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove access and stop all syncing. Your existing
                    data won't be deleted. You can reconnect anytime.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      onDisconnect(provider.id);
                      onOpenChange(false);
                    }}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button size="sm" className="h-7 text-[11px]" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Provider Row ─────────────────────────────────────────────────────────────

interface ProviderRowProps {
  provider: Provider;
  onConnect: (id: Provider["id"]) => void;
  onDisconnect: (id: Provider["id"]) => void;
  onViewDetails: (provider: Provider) => void;
}

const ProviderRow = ({
  provider,
  onConnect,
  onDisconnect,
  onViewDetails,
}: ProviderRowProps) => {
  const { status, account } = provider;
  const cfg = statusConfig[status];
  const isConnected = status === "connected";
  const isError = status === "error";
  const isLoading = status === "loading";

  return (
    <div className="flex items-center gap-3 py-3 px-4">
      {/* Icon */}
      <div className="p-1.5 rounded-md bg-muted shrink-0">
        {providerIcon[provider.id]}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-medium">{provider.name}</p>
          <Badge
            className={`${cfg.badge} text-[10px] px-1.5 h-4 flex items-center gap-1`}
            variant="secondary"
          >
            {cfg.icon}
            {cfg.label}
          </Badge>
        </div>

        {account ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Avatar className="w-3.5 h-3.5">
              <AvatarImage src={account.avatarUrl} />
              <AvatarFallback className="text-[8px]">
                {account.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <p className="text-[11px] text-muted-foreground truncate">{account.email}</p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {provider.description}
          </p>
        )}

        {isError && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Re-authorization required
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] px-2.5 gap-1"
            onClick={() => onViewDetails(provider)}
          >
            Manage
            <ChevronRight className="w-3 h-3" />
          </Button>
        )}
        {isError && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5"
            onClick={() => onConnect(provider.id)}
            disabled={isLoading}
          >
            <RefreshCw className="w-3 h-3" />
            Reconnect
          </Button>
        )}
        {status === "disconnected" && (
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5"
            onClick={() => onConnect(provider.id)}
            disabled={isLoading}
          >
            <Link2 className="w-3 h-3" />
            Connect
          </Button>
        )}
        {isLoading && (
          <Button size="sm" className="h-7 text-[11px]" disabled>
            <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
            Connecting…
          </Button>
        )}
      </div>
    </div>
  );
};

// ─── Main Settings Page ───────────────────────────────────────────────────────

const Settings = () => {
  const [providers, setProviders] = useState<Provider[]>(MOCK_PROVIDERS);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [detailProvider, setDetailProvider] = useState<Provider | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const connectedCount = providers.filter((p) => p.status === "connected").length;

  // ── API stubs ──────────────────────────────────────────────────────────────

  const handleConnect = async (id: Provider["id"]) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "loading" } : p))
    );

    try {
      const currentPage =
        window.location.pathname + window.location.search;

      const res = await axios.get(
        `/oauth/google/calendar?redirect_to=${encodeURIComponent(currentPage)}`
      );

      // console.log("OAuth URL:", res.data);

      window.location.href = res.data;

    } catch {
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "error" } : p))
      );
    }
  };

  const handleDisconnect = async (id: Provider["id"]) => {
    // TODO: await axios.delete(`/integrations/${id}`);
    setProviders((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: "disconnected" as ProviderStatus, account: undefined } : p
      )
    );
  };

  const handleViewDetails = (provider: Provider) => {
    setDetailProvider(provider);
    setDetailOpen(true);
  };

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="w-full mx-auto px-6 py-5 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h1 className="text-sm font-semibold">Settings</h1>
      </div>

      {/* ── Integrations card ── */}
      <Card className="border-border/40">
        <CardHeader className="px-5 py-3 border-b border-border/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Integrations</CardTitle>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">
                {connectedCount} of {providers.length} connected
              </span>
              <Badge
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] px-1.5 h-4"
                variant="secondary"
              >
                {connectedCount} active
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {providers.map((p, i) => (
            <div key={p.id}>
              <ProviderRow
                provider={p}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onViewDetails={handleViewDetails}
              />
              {i < providers.length - 1 && (
                <div className="mx-4 border-t border-border/20" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Two-column: Notifications + Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Notifications */}
        <Card className="border-border/40">
          <CardHeader className="px-5 py-3 border-b border-border/20">
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Email notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  Sync summaries and alerts via email
                </p>
              </div>
              <Switch checked={notifEmail} onCheckedChange={setNotifEmail} />
            </div>
            <div className="border-t border-border/20" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Push notifications</p>
                <p className="text-[10px] text-muted-foreground">
                  Real-time alerts in your browser
                </p>
              </div>
              <Switch checked={notifPush} onCheckedChange={setNotifPush} />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/40">
          <CardHeader className="px-5 py-3 border-b border-border/20">
            <CardTitle className="text-sm font-semibold">Security</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-3 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium">OAuth 2.0 secured</p>
                <p className="text-[10px] text-muted-foreground">
                  All integrations use OAuth 2.0. We never store your passwords.
                </p>
              </div>
            </div>
            <div className="border-t border-border/20" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Token expiry alerts</p>
                <p className="text-[10px] text-muted-foreground">
                  Notify when access tokens are expiring
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                Soon
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Danger Zone ── */}
      <Card className="border-red-200/60 dark:border-red-900/40">
        <CardContent className="px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Revoke all integrations
              </p>
              <p className="text-[10px] text-muted-foreground">
                Disconnect all providers and clear cached tokens
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-[11px] gap-1.5 shrink-0"
                  disabled={connectedCount === 0}
                >
                  <Ban className="w-3 h-3" />
                  Revoke all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke all integrations?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disconnect all {connectedCount} active integration
                    {connectedCount !== 1 ? "s" : ""} and clear all cached tokens.
                    You will need to reconnect each service manually.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      setProviders((prev) =>
                        prev.map((p) => ({
                          ...p,
                          status: "disconnected" as ProviderStatus,
                          account: undefined,
                        }))
                      )
                    }
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Revoke all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* ── Detail dialog ── */}
      <DetailDialog
        provider={detailProvider}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
};

export default Settings;