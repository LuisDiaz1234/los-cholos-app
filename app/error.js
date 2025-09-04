'use client';

export default function Error({ error, reset }) {
  return (
    <div className="card">
      <h2>Ups, algo salió mal</h2>
      <div className="alert err" style={{whiteSpace:'pre-wrap'}}>
        {error?.message || 'Error inesperado.'}
      </div>
      <button className="btn" onClick={() => reset()}>Reintentar</button>
    </div>
  );
}
