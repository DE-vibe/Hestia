import React, { useState } from "react";
import { Flame, Check, Sparkles, CreditCard, Shield, X, HelpCircle, Loader2 } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: () => void;
}

export default function PricingModal({ isOpen, onClose, onUpgradeSuccess }: PricingModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate payment processor stoking the fire
    setTimeout(() => {
      setLoading(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        onUpgradeSuccess();
        setPaymentSuccess(false);
        onClose();
      }, 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden relative flex flex-col md:flex-row transition-all duration-300 max-h-[90vh] md:max-h-none overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left column: Flame Branding & Tier Information */}
        <div className="w-full md:w-1/2 bg-stone-950 text-stone-100 p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1c1917_1px,transparent_1px),linear-gradient(to_bottom,#1c1917_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />
          <div className="absolute top-0 right-0 w-44 h-44 bg-orange-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Flame className="w-4.5 h-4.5 text-white fill-white/10" />
              </div>
              <span className="font-bold text-xs tracking-widest uppercase text-amber-500">HESTIA GOLDEN EMBERS</span>
            </div>

            <div>
              <h3 className="text-2xl font-black tracking-tight leading-tight">UPGRADE TO THE GOLDEN HEARTH</h3>
              <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                Stoke your engineering hearth to maximum capacity. Fuel your projects with unlimited transfers and full Gemini AI intelligence.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Unlimited Code Pushes</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">Push code packages from any device or AI Studio without daily limits.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Full Gemini AI Copilot</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">Unlock Gemini-driven commit message recommendations and automatic premium readme files.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Private Repository Provisioning</h4>
                  <p className="text-[10px] text-stone-400 mt-0.5">Create and target unlimited secure private repositories directly from Hestia.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-stone-800 text-[10px] text-stone-500 leading-relaxed font-mono">
            Secure billing &bull; Instant activation &bull; Cancel any time with 1-click.
          </div>
        </div>

        {/* Right column: Interactive Premium Billing Selector & Credit Card Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Select Billing Interval</h4>
              
              <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setBillingPeriod("monthly")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    billingPeriod === "monthly"
                      ? "bg-white text-stone-950 shadow-xs"
                      : "text-stone-500 hover:text-stone-850"
                  }`}
                >
                  Monthly ($9)
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod("yearly")}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    billingPeriod === "yearly"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-500 hover:text-stone-850"
                  }`}
                >
                  Yearly ($49)
                  <span className="bg-amber-500 text-stone-950 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full scale-90">
                    Save 55%
                  </span>
                </button>
              </div>
            </div>

            {paymentSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center animate-bounce">
                <div className="w-14 h-14 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-stone-950">Payment Successful!</h4>
                <p className="text-xs text-stone-500 mt-1">Stoking the premium golden embers on your account...</p>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-orange-800 font-semibold uppercase tracking-wider">Hearth Master License</span>
                    <span className="text-xs font-bold text-stone-900">
                      {billingPeriod === "monthly" ? "$9.00 / billed monthly" : "$49.00 / billed annually"}
                    </span>
                  </div>
                  <Sparkles className="w-5 h-5 text-orange-500 fill-orange-200 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Daniele Likene"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19))}
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-mono"
                      />
                      <CreditCard className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM / YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value.replace(/\s?/g, '').replace(/(\d{2})/g, '$1/').trim().replace(/\/$/, '').slice(0, 5))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                        Security Code (CVC)
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-orange-500/10 flex items-center justify-center gap-1.5 transition disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-3.5 h-3.5" />
                      Authorize & Unlock Hearth Premium
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="pt-4 text-[10px] text-stone-400 text-center flex items-center justify-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-stone-300" />
            <span>Mock payment processing for local preview sessions</span>
          </div>
        </div>

      </div>
    </div>
  );
}
