import { createAdminClient } from "@/utils/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTranslations } from "next-intl/server";

interface PaymentLog {
  id: string;
  payment_key: string;
  order_id: string;
  order_name: string;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
  user: { email: string } | null;
}

async function getPaymentLogs(): Promise<PaymentLog[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("toss_payments")
    .select("*, user:users!toss_payments_user_id_public_users_fkey(email)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (data as unknown as PaymentLog[]) || [];
}

export default async function AdminPaymentLogsPage() {
  const logs = await getPaymentLogs();
  const t = await getTranslations("Admin.webhooks");

  const stats = {
    total: logs.length,
    done: logs.filter((l) => l.status === "DONE").length,
    totalAmount: logs.reduce((sum, l) => sum + l.amount, 0),
    totalCredits: logs.reduce((sum, l) => sum + l.credits, 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">결제 로그</h1>
        <p className="text-muted-foreground">토스페이먼츠 결제 처리 내역</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">전체 건수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">성공</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.done}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount.toLocaleString("ko-KR")}원
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 크레딧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {stats.totalCredits.toLocaleString()}cr
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>최근 결제 로그 (50건)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>시간</TableHead>
                <TableHead>사용자</TableHead>
                <TableHead>주문</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead className="text-right">크레딧</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>결제키</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.user?.email || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.order_name}</div>
                    <div className="text-xs text-muted-foreground">{log.order_id}</div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {log.amount.toLocaleString("ko-KR")}원
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    +{log.credits}cr
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === "DONE" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.payment_key.substring(0, 20)}...
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    결제 로그가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
