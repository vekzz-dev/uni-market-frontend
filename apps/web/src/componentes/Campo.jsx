import estilos from './Campo.module.css';

export function Campo({ id, etiqueta, ayuda, error, ...props }) {
  const idAyuda = `${id}-ayuda`;
  const descrito = error || ayuda ? idAyuda : undefined;

  return (
    <div className={estilos.campo}>
      <label className={estilos.etiqueta} htmlFor={id}>
        {etiqueta}
      </label>
      <input
        id={id}
        className={estilos.input}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={descrito}
        {...props}
      />
      {(error || ayuda) && (
        <p id={idAyuda} className={error ? estilos.error : estilos.ayuda}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}
