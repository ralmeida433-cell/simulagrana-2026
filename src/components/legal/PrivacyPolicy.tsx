import React from 'react';
import { Shield, Lock, Eye, FileText, Globe, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Política de Privacidade</h1>
        <p className="text-muted-foreground">Última atualização: 20 de Março de 2026</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Eye className="w-5 h-5" />
            <h2 className="text-xl font-bold">1. Coleta de Informações</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Nós coletamos informações que você nos fornece diretamente ao usar o SimulaGrana. Isso pode incluir dados de simulações financeiras, preferências de investimento e informações de contato caso você opte por nos enviar uma mensagem.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
            <h2 className="text-xl font-bold">2. Uso das Informações</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            As informações coletadas são usadas exclusivamente para:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
            <li>Fornecer e manter nossas ferramentas de simulação;</li>
            <li>Personalizar sua experiência no aplicativo;</li>
            <li>Melhorar nossas ferramentas e algoritmos de análise;</li>
            <li>Comunicar atualizações importantes sobre o serviço.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Globe className="w-5 h-5" />
            <h2 className="text-xl font-bold">3. Cookies e Google AdSense</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies para melhorar sua experiência de navegação. Além disso, exibimos anúncios através do Google AdSense. O Google utiliza cookies para exibir anúncios com base em suas visitas anteriores a este e outros sites na internet. Você pode desativar a publicidade personalizada visitando as Configurações de Anúncios do Google.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <Mail className="w-5 h-5" />
            <h2 className="text-xl font-bold">4. Contato</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco através do e-mail: <span className="font-semibold text-emerald-600 dark:text-emerald-400">contato@simulagrana.com.br</span>
          </p>
        </section>
      </div>
    </div>
  );
}
