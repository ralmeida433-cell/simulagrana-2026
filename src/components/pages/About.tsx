import React from 'react';
import { Info, Target, Users, Award, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Info className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Sobre o SimulaGrana</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Empoderando investidores através de ferramentas de análise financeira de alta qualidade e fácil acesso.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Nossa Missão</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nossa missão é democratizar o acesso a ferramentas de análise financeira avançadas, permitindo que qualquer pessoa possa tomar decisões de investimento mais informadas e conscientes.
          </p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Para Quem?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Desde o investidor iniciante que está começando a poupar até o analista experiente que busca ferramentas rápidas e confiáveis para validar suas teses de investimento.
          </p>
        </div>
      </div>

      <div className="bg-emerald-600 rounded-3xl p-12 text-white text-center space-y-6">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold">Feito com Paixão</h2>
        <p className="text-emerald-50 max-w-2xl mx-auto text-lg">
          O SimulaGrana nasceu da necessidade de consolidar as melhores metodologias de investimento (como as de Peter Lynch, Benjamin Graham e Luiz Barsi) em uma plataforma intuitiva e moderna.
        </p>
      </div>
    </div>
  );
}
