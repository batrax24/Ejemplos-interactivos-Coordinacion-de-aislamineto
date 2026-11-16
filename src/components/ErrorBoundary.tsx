import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Icon } from './ui';
import { exportProgress, loadProgress, resetProgress } from '../lib/storage';

/**
 * Red de seguridad de la aplicación.
 *
 * Si una escena, una gráfica o un caso con datos raros lanza una excepción, no
 * se pierde la sesión: la app muestra esta pantalla en lugar de quedarse en
 * blanco y ofrece recuperar el estado (el progreso se relee del
 * almacenamiento), descargarlo como archivo o reiniciarlo.
 */
interface Props {
  children: ReactNode;
  /** Cambia cuando el usuario navega: así se reintenta la pantalla nueva. */
  resetKey?: string;
}

interface State {
  error: Error | null;
  info: string | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null, copied: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Queda en consola para poder copiarlo si hay que reportar el fallo.
    console.error('[LAB·CA] fallo de render:', error, info.componentStack);
    this.setState({ info: (info.componentStack ?? '').split('\n').slice(0, 6).join('\n') });
  }

  componentDidUpdate(prev: Props) {
    // Al cambiar de pantalla se limpia el error y se reintenta.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null, info: null, copied: false });
    }
  }

  private download = () => {
    const data = exportProgress(loadProgress());
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `labca-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  private copy = async () => {
    const txt = `${this.state.error?.name ?? 'Error'}: ${this.state.error?.message ?? ''}\n${
      this.state.info ?? ''
    }`;
    try {
      await navigator.clipboard.writeText(txt);
      this.setState({ copied: true });
    } catch {
      this.setState({ copied: false });
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="crash">
        <div className="crash__card" role="alert">
          <span className="crash__icon">
            <Icon name="x" size={22} />
          </span>
          <h2>Esta pantalla se detuvo, pero tu avance no</h2>
          <p>
            Ocurrió un error al dibujar esta vista. El laboratorio guarda el progreso en el navegador, así que puedes
            volver a la portada y continuar donde estabas. Si el fallo se repite, descarga tu progreso antes de
            reiniciar.
          </p>
          <code className="crash__msg">{error.message || String(error)}</code>
          {this.state.info && <pre className="crash__stack">{this.state.info}</pre>}
          <div className="crash__actions">
            <button type="button" className="btn btn--primary" onClick={() => this.setState({ error: null, info: null })}>
              <Icon name="reset" size={15} /> Reintentar
            </button>
            <button type="button" className="btn btn--ghost" onClick={this.download}>
              <Icon name="arrowRight" size={15} /> Descargar mi progreso
            </button>
            <button type="button" className="btn btn--ghost" onClick={this.copy}>
              <Icon name="info" size={15} /> {this.state.copied ? 'Detalle copiado' : 'Copiar el detalle'}
            </button>
            <button
              type="button"
              className="btn btn--ghost crash__danger"
              onClick={() => {
                resetProgress();
                window.location.reload();
              }}
            >
              <Icon name="x" size={15} /> Reiniciar desde cero
            </button>
          </div>
          <p className="crash__hint">
            «Reiniciar» borra también la copia de seguridad del progreso. Por eso el botón de descargar está primero.
          </p>
        </div>
      </div>
    );
  }
}
