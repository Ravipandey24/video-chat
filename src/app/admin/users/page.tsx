"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { 
  UserCheck, 
  UserX, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type User = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);
  
  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/admin/pending-users");
      
      if (!response.ok) {
        throw new Error("Failed to fetch pending users");
      }
      
      const data = await response.json();
      setPendingUsers(data.users);
      setError(null);
    } catch (error: any) {
      console.error("Error fetching pending users:", error);
      setError(error.message || "Failed to load pending users");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Load pending users on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchPendingUsers();
    }
  }, [status]);
  
  // Handle user approval
  const handleApproveUser = async (userId: string) => {
    try {
      setApprovalStatus(prev => ({ ...prev, [userId]: 'pending' }));
      
      const response = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to approve user");
      }
      
      setApprovalStatus(prev => ({ ...prev, [userId]: 'success' }));
      
      // Refresh the list after a short delay
      setTimeout(() => {
        fetchPendingUsers();
        setApprovalStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[userId];
          return newStatus;
        });
      }, 1500);
      
    } catch (error) {
      console.error("Error approving user:", error);
      setApprovalStatus(prev => ({ ...prev, [userId]: 'error' }));
    }
  };
  
  // Loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading user management...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Approve or reject pending user registrations
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchPendingUsers}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh List
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2" />
            Pending User Approvals
          </CardTitle>
          <CardDescription>
            Review and approve users who have registered for the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-10">
              <UserCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">No pending user approvals</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        {approvalStatus[user.id] === 'pending' && (
                          <Button disabled variant="ghost" size="sm">
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            Processing...
                          </Button>
                        )}
                        
                        {approvalStatus[user.id] === 'success' && (
                          <Button disabled variant="ghost" size="sm" className="text-green-500">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approved!
                          </Button>
                        )}
                        
                        {approvalStatus[user.id] === 'error' && (
                          <Button disabled variant="ghost" size="sm" className="text-red-500">
                            <XCircle className="h-4 w-4 mr-1" />
                            Failed
                          </Button>
                        )}
                        
                        {!approvalStatus[user.id] && (
                          <div className="flex justify-end gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex gap-1 items-center"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve User</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to approve this user?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <p><strong>Name:</strong> {user.name}</p>
                                  <p><strong>Email:</strong> {user.email}</p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="default"
                                    onClick={() => handleApproveUser(user.id)}
                                  >
                                    Approve User
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex gap-1 items-center text-destructive border-destructive/30 hover:bg-destructive/10"
                                >
                                  <UserX className="h-4 w-4" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject User</DialogTitle>
                                  <DialogDescription>
                                    This feature is not yet implemented. In a full implementation, you would be able to reject users and optionally send them a reason.
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t bg-muted/50 py-3 px-6">
          <p className="text-sm text-muted-foreground">
            Total pending approvals: {pendingUsers.length}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 