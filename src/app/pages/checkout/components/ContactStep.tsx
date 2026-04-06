import { ChevronRight, Mail, Phone } from "lucide-react";
import { StepBadge, Section } from "./StepIndicator";
import type { CheckoutState, CheckoutAction } from "../types";

interface ContactStepProps {
    state: CheckoutState;
    dispatch: React.Dispatch<CheckoutAction>;
    step1Valid: boolean;
}

export function ContactStep({ state, dispatch, step1Valid }: ContactStepProps) {
    const { step, contact } = state;

    return (
        <Section>
            <button
                className="w-full flex items-center gap-3 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => dispatch({ type: "SET_STEP", step: 1 })}
            >
                <StepBadge n={1} active={step === 1} done={step > 1 && !!step1Valid} />
                <div className="flex-1">
                    <p className="text-sm text-gray-900">Información de contacto</p>
                    {step !== 1 && contact.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{contact.email} · {contact.phone}</p>
                    )}
                </div>
                {step !== 1 && <ChevronRight className="w-4 h-4 text-gray-300" strokeWidth={1.5} />}
            </button>

            {step === 1 && (
                <div className="px-6 pb-6 border-t border-gray-50">
                    <div className="pt-5 grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                                <Mail className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={contact.email}
                                onChange={(e) => dispatch({ type: "SET_CONTACT", payload: { email: e.target.value } })}
                                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                                placeholder="your@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                                <Phone className="inline w-3 h-3 mr-1" strokeWidth={1.5} />
                                Teléfono
                            </label>
                            <input
                                type="tel"
                                value={contact.phone}
                                onChange={(e) => dispatch({ type: "SET_CONTACT", payload: { phone: e.target.value } })}
                                className="w-full text-sm text-gray-900 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                                placeholder="+1 (212) 555-0000"
                            />
                        </div>
                    </div>
                    <div className="mt-5 flex justify-end">
                        <button
                            onClick={() => step1Valid && dispatch({ type: "SET_STEP", step: 2 })}
                            disabled={!step1Valid}
                            className={`inline-flex items-center gap-2 text-sm rounded-xl px-5 py-2.5 transition-colors ${step1Valid ? "bg-gray-200 text-gray-700 hover:bg-gray-300" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                                }`}
                        >
                            Continuar
                            <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>
            )}
        </Section>
    );
}
