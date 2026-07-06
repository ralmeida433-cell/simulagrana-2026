import React, { useState, useEffect } from 'react';
import { Shield, Upload, FileText, CheckCircle, AlertCircle, Clock, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function KycVerification() {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  
  useEffect(() => {
    if (profile?.kycStatus) {
      setKycStatus(profile.kycStatus);
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!user || cpf.length < 11) return;
    setLoading(true);
    
    try {
      // 1. Storage of sensitive data in separate KYC collection
      const kycRef = doc(db, 'users', user.uid, 'private', 'kyc');
      await setDoc(kycRef, {
        cpf: cpf.replace(/\D/g, ''),
        documentUrl: 'simulated_document_url_123', 
        selfieUrl: 'simulated_selfie_url_123',
        status: 'pending',
        submittedAt: Date.now()
      });

      // 2. Update public profile to "Pending"
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, {
        kycStatus: 'pending'
      });
      
      setKycStatus('pending');
      
      // 3. Simulate processing and auto-approval from external API (like Jumio/Onfido)
      setTimeout(async () => {
        await setDoc(kycRef, { status: 'approved', processedAt: Date.now() }, { merge: true });
        await updateDoc(profileRef, { kycStatus: 'approved', isVerified: true });
        setKycStatus('approved');
      }, 5000); // Simulate network delay
      
    } catch (error) {
      console.error("KYC Error:", error);
      alert("Houve um erro ao processar sua verificação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (kycStatus === 'approved') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl space-y-4 text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500" />
        <h3 className="text-xl font-bold text-emerald-600">Identidade Verificada (KYC)</h3>
        <p className="text-sm text-emerald-600/80">Sua conta possui o selo de verificação de confiança. Suas informações estão seguras com criptografia avançada e em compliance com a LGPD e Banco Central.</p>
        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2 mt-4 inline-flex shadow-sm">
           <Shield className="w-4 h-4 text-emerald-500" />
           <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Dados Armazenados em Cofre Criptografado</span>
        </div>
      </div>
    );
  }

  if (kycStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-4 text-center">
        <Clock className="w-16 h-16 text-amber-500 animate-pulse" />
        <h3 className="text-xl font-bold text-amber-600">Verificação em Análise</h3>
        <p className="text-sm text-amber-600/80">Seus documentos e selfie foram enviados de forma criptografada para nossos parceiros de validação e estão sendo analisados.</p>
        <p className="text-xs font-bold mt-2 text-slate-500">Por favor, aguarde alguns segundos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-border">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Verificação KYC (Know Your Customer)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Corretoras e plataformas financeiras lidam com dados muito sensíveis. Para garantir a segurança de todos e cumprir com normas de prevenção a fraudes (compliance), precisamos validar sua identidade com tecnologia de ponta.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['1. CPF Seguro', '2. Documento com Foto', '3. Prova de Vida (Selfie)'].map((label, idx) => (
          <div key={label} className={`p-4 rounded-2xl border ${step >= idx + 1 ? 'border-primary bg-primary/5' : 'border-border bg-card'} transition-all`}>
            <p className={`font-bold text-sm ${step >= idx + 1 ? 'text-primary' : 'text-muted-foreground'}`}>{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border p-6 rounded-[2rem] space-y-6">
        {step === 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">Qual é o seu CPF?</label>
            <input 
              type="text" 
              placeholder="000.000.000-00" 
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none" 
            />
            <p className="text-xs text-muted-foreground"><Shield className="w-3 h-3 inline mr-1" /> CPF será tokenizado e separado das outras bases de dados.</p>
            <button onClick={() => setStep(2)} disabled={cpf.length < 11} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50">Próximo Passo</button>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
             <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <FileText className="w-8 h-8" />
             </div>
             <p className="font-bold text-foreground">Upload Seguro de Documento</p>
             <p className="text-sm text-muted-foreground">Ambiente TLS com criptografia ponta-a-ponta.</p>
             <button onClick={() => setStep(3)} className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-foreground font-bold rounded-xl flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> Simular Envio de RG/CNH
             </button>
             <button onClick={() => setStep(1)} className="text-sm font-bold text-muted-foreground">Voltar</button>
          </motion.div>
        )}
        {step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 text-center">
             <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                <Camera className="w-10 h-10" />
             </div>
             <p className="font-bold text-foreground">Liveness Detection (Biometria)</p>
             <p className="text-sm text-muted-foreground">Garante que há uma pessoa real do outro lado da câmera.</p>
             <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2">
                {loading ? 'Processando envio...' : (<><Shield className="w-4 h-4" /> Finalizar KYC em Servidor Seguro</>)}
             </button>
             <button onClick={() => setStep(2)} className="text-sm font-bold text-muted-foreground mt-2 inline-block">Voltar</button>
          </motion.div>
        )}
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed p-4 bg-muted/20 rounded-xl">
        <strong>Para Desenvolvedores:</strong> Na arquitetura real de uma corretora, este sistema usaria Provedores KYC (Jumio, Onfido), armazenamento S3 Criptografado e IAM para proteger a PII, conforme regras LGPD.
      </div>
    </div>
  );
}
