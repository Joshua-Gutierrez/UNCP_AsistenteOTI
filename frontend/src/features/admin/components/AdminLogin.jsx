import { FiAlertTriangle, FiMail, FiLock, FiLoader } from 'react-icons/fi';
import logoUncp from '../../../assets/logo_uncp.png';
import { useAdminLogin } from '../hooks/useAdminLogin';

export default function AdminLogin() {
  const {
    correo,
    setCorreo,
    password,
    setPassword,
    error,
    loading,
    handleSubmit
  } = useAdminLogin();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <img src={logoUncp} alt="Logo UNCP" className="w-24 h-24 object-contain mb-2" />
          <h1 className="text-2xl font-bold text-[var(--color-text)]">UNCP Asistente</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Panel de Administración</p>
        </div>

        {/* Login Card */}
        <div className="card p-6 md:p-8">
          {error && (
            <div className="alert alert-error mb-6 animate-fade-in" role="alert">
              <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="correo" className="label">Correo electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-dim)]" />
                <input
                  id="correo"
                  type="email"
                  placeholder="admin@uncp.edu.pe"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                  autoComplete="email"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Contraseña</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-dim)]" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="input pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-text-dim)]">
            ¿No tienes cuenta? Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}
