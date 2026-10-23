import SocialBridge from './SocialBridge.jsx'

export default function Footer() {
  return (
    <footer className="site-footer">
      <SocialBridge agents={[]} compact />
      <p>
        <strong>
          &copy; Lorenzo Cardoso - Engenheiro de Software &amp; Automacao / Cientista de Dados / Tradutor / Professor / Escritor Academico
        </strong>
      </p>
    </footer>
  )
}
