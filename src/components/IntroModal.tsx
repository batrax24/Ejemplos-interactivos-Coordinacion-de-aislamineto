import { useState } from 'react';
import { Icon } from './ui';
import { sfx } from '../lib/audio';

const STEPS = [
  {
    icon: 'gauge',
    title: 'Mueve los parámetros',
    text: 'Cada experimento parte de un ejemplo real del material (245 kV, 21 discos, δ = 0,90…). Arrastra un deslizador y todo se recalcula al instante.',
  },
  {
    icon: 'eye',
    title: 'Mira la escena y la gráfica',
    text: 'La escena animada y la gráfica usan los mismos números que la ecuación. Si la lectura sale del rango, el veredicto cambia de color.',
  },
  {
    icon: 'target',
    title: 'Supera el reto',
    text: 'Cada estación propone una meta técnica. Valídala para ganar XP y estrellas: sin pistas y al primer intento obtienes 3.',
  },
  {
    icon: 'trophy',
    title: 'Llega a la misión final',
    text: 'En el experimento 14 se juntan altitud, cadena, descargador y BIL. Coordina todo el proyecto para convertirte en Coordinador senior.',
  },
];

export function IntroModal({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Cómo funciona el laboratorio">
      <div className="modal">
        <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
          <Icon name="x" size={18} />
        </button>
        <div className="modal__icon">
          <Icon name={step.icon} size={26} />
        </div>
        <p className="modal__step">
          Paso {i + 1} de {STEPS.length}
        </p>
        <h2>{step.title}</h2>
        <p className="modal__text">{step.text}</p>
        <div className="modal__dots">
          {STEPS.map((_, k) => (
            <button
              key={k}
              type="button"
              className={k === i ? 'on' : ''}
              onClick={() => {
                setI(k);
                sfx.tick();
              }}
              aria-label={`Paso ${k + 1}`}
            />
          ))}
        </div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Saltar
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              sfx.click();
              if (last) onClose();
              else setI(i + 1);
            }}
          >
            {last ? 'Entrar al laboratorio' : 'Siguiente'} <Icon name="arrowRight" size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
