import React from 'react';
import { FileText, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
          <FileText className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="text-muted-foreground">Última atualização: 20 de Março de 2026</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm space-y-8">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <CheckCircle className="w-5 h-5" />
            <h2 className="text-xl font-bold">1. Aceitação dos Termos</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Ao acessar e usar o SimulaGrana, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá usar nosso serviço.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="text-xl font-bold">2. Isenção de Responsabilidade Financeira</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            O SimulaGrana é uma ferramenta de simulação e análise educacional. <span className="font-bold text-red-600 dark:text-red-400">Não fornecemos aconselhamento financeiro, jurídico ou tributário.</span> Todas as decisões de investimento são de sua inteira responsabilidade. Recomendamos consultar um profissional qualificado antes de tomar qualquer decisão financeira importante.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-xl font-bold">3. Uso do Serviço</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Você concorda em usar o serviço apenas para fins lícitos e de maneira que não infrinja os direitos de terceiros ou restrinja o uso e aproveitamento do serviço por qualquer outra pessoa.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
            <h2 className="text-xl font-bold">4. Modificações nos Termos</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação no site. Seu uso continuado do serviço após tais alterações constitui sua aceitação dos novos Termos de Uso.
          </p>
        </section>
      </div>
    </div>
  );
}
