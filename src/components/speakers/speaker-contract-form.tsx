"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCreateContract } from "@/hooks/use-speakers";
import { useToast } from "@/hooks/use-toast";

interface SpeakerContractFormProps {
  speakerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpeakerContractForm({
  speakerId,
  open,
  onOpenChange,
}: SpeakerContractFormProps) {
  const { toast } = useToast();
  const createContract = useCreateContract(speakerId);

  const [fee, setFee] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState("사후");
  const [transportSupport, setTransportSupport] = useState(false);
  const [lodgingSupport, setLodgingSupport] = useState(false);
  const [taxInvoice, setTaxInvoice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContract.mutateAsync({
        fee,
        paymentTerms,
        transportSupport,
        lodgingSupport,
        taxInvoice,
      });
      toast({ title: "계약이 생성되었습니다" });
      onOpenChange(false);
      // Reset
      setFee(0);
      setPaymentTerms("사후");
      setTransportSupport(false);
      setLodgingSupport(false);
      setTaxInvoice(false);
    } catch (err) {
      toast({
        title: "계약 생성 실패",
        description: err instanceof Error ? err.message : "다시 시도해주세요",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>새 계약 생성</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fee">강연료 (원)</Label>
            <Input
              id="fee"
              type="number"
              min={0}
              step={10000}
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>결제 조건</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="사전">사전 결제</SelectItem>
                <SelectItem value="사후">사후 결제</SelectItem>
                <SelectItem value="분할">분할 결제</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={transportSupport}
                onChange={(e) => setTransportSupport(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">교통비 지원</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lodgingSupport}
                onChange={(e) => setLodgingSupport(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">숙박비 지원</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={taxInvoice}
                onChange={(e) => setTaxInvoice(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">세금계산서 발행</span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={createContract.isPending}>
              {createContract.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
