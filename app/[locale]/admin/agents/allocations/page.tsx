"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, ExternalLink, Search, X, UserCheck, UserCog } from "lucide-react";

interface AgentAllocation {
  id: string;
  wallet: string;
  agentLevel: 1 | 2;
  masterAgentId?: string;
  masterWallet?: string;
  preGVTAllocated: number;
  sGVTAllocated: number;
  allocatedAt: string;
  kolId?: string;
}

interface AllocationWithKol {
  allocation: AgentAllocation;
  kolProfile: {
    id: string;
    displayName?: string;
    refCode?: string;
    email?: string;
  } | null;
}

export default function AllocationsPage() {
  const [loading, setLoading] = useState(true);
  const [allocations, setAllocations] = useState<AllocationWithKol[]>([]);
  const [filteredAllocations, setFilteredAllocations] = useState<AllocationWithKol[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  const fetchAllocations = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const idToken = await auth.currentUser.getIdToken(true);

      const res = await fetch("/api/admin/agents/allocations", {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch allocations");
      }

      const result = await res.json();
      if (result.success) {
        setAllocations(result.allocations || []);
        setFilteredAllocations(result.allocations || []);
      } else {
        throw new Error(result.error || "Failed to fetch data");
      }
    } catch (error: any) {
      console.error("Error fetching allocations:", error);
      toast.error("Failed to load allocations", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  useEffect(() => {
    let filtered = allocations;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.allocation.wallet.toLowerCase().includes(searchLower) ||
          item.kolProfile?.displayName?.toLowerCase().includes(searchLower) ||
          item.kolProfile?.id?.toLowerCase().includes(searchLower) ||
          item.kolProfile?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply level filter
    if (levelFilter !== "all") {
      const level = parseInt(levelFilter);
      filtered = filtered.filter((item) => item.allocation.agentLevel === level);
    }

    setFilteredAllocations(filtered);
  }, [searchTerm, levelFilter, allocations]);

  const doSignOut = async () => {
    await auth.signOut();
  };

  const formatAddress = (address: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const totals = allocations.reduce(
    (acc, item) => {
      acc.totalPreGVT += item.allocation.preGVTAllocated;
      acc.totalSGVT += item.allocation.sGVTAllocated;
      acc.masterCount += item.allocation.agentLevel === 1 ? 1 : 0;
      acc.subAgentCount += item.allocation.agentLevel === 2 ? 1 : 0;
      return acc;
    },
    { totalPreGVT: 0, totalSGVT: 0, masterCount: 0, subAgentCount: 0 }
  );

  return (
    <DashboardLayout
      user={{
        email: auth.currentUser?.email,
        name: auth.currentUser?.displayName,
        avatar: auth.currentUser?.photoURL,
      }}
      onSignOut={doSignOut}
    >
      <div className="space-y-6 w-full min-w-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Agent Allocations</h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            View and manage preGVT and sGVT token allocations
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allocations.length}</div>
              <p className="text-xs text-muted-foreground">
                {totals.masterCount} Masters, {totals.subAgentCount} Sub-Agents
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total preGVT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totals.totalPreGVT)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total sGVT</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(totals.totalSGVT)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filtered Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAllocations.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by wallet, name, KOL ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="1">Master Agents (Level-1)</SelectItem>
                    <SelectItem value="2">Sub-Agents (Level-2)</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm || levelFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setLevelFilter("all");
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Allocations Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Allocations</CardTitle>
              <CardDescription>
                {filteredAllocations.length} allocation{filteredAllocations.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>KOL ID / RefCode</TableHead>
                      <TableHead>preGVT</TableHead>
                      <TableHead>sGVT</TableHead>
                      <TableHead>Master</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No allocations found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAllocations.map((item) => (
                        <TableRow key={item.allocation.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {item.kolProfile?.displayName || "N/A"}
                              </div>
                              {item.kolProfile?.email && (
                                <div className="text-sm text-muted-foreground">
                                  {item.kolProfile.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.allocation.agentLevel === 1 ? "default" : "secondary"}>
                              {item.allocation.agentLevel === 1 ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Level-1
                                </>
                              ) : (
                                <>
                                  <UserCog className="h-3 w-3 mr-1" />
                                  Level-2
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-xs">{formatAddress(item.allocation.wallet)}</code>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(item.allocation.wallet)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.kolProfile?.id ? (
                              <code className="text-xs">{item.kolProfile.id}</code>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatNumber(item.allocation.preGVTAllocated)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatNumber(item.allocation.sGVTAllocated)}</div>
                          </TableCell>
                          <TableCell>
                            {item.allocation.agentLevel === 2 && item.allocation.masterWallet ? (
                              <code className="text-xs">{formatAddress(item.allocation.masterWallet)}</code>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const url = `https://bscscan.com/address/${item.allocation.wallet}`;
                                  window.open(url, "_blank");
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

