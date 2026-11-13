import { KitchenShowroom3D } from '../components/kitchen-showroom-3d';
import { BrandJourney } from '../components/brand-journey';
import { Arrow } from '../components/experience';
import { BLUM_CONFIGURATOR } from '../lib/brand-resources';
import './kitchen-three.css';

export default function Page() {
  return <>
    <KitchenShowroom3D />
    <section id="configurador" className="configurator-section" aria-labelledby="configurator-title">
      <img className="configurator-image" src="/assets/blum-configurator-workspace-hd.webp" alt="Espacio de trabajo del configurador de Blum con el modelo 3D de un cajón" width={1448} height={1086} loading="lazy" decoding="async" />
      <div className="configurator-copy">
        <h2 id="configurator-title">Configurador Blum</h2>
        <p>Elige los herrajes y planifica tu mueble.</p>
        <a href={BLUM_CONFIGURATOR} className="kitchen-button" target="_blank" rel="noopener noreferrer">Abrir configurador <Arrow diagonal /></a>
      </div>
    </section>
    <BrandJourney />
  </>;
}
