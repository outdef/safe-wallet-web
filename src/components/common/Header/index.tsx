import { type ReactElement } from 'react'
import { IconButton, Paper } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import classnames from 'classnames'
import css from './styles.module.css'
import ChainSwitcher from '@/components/common/ChainSwitcher'
import ConnectWallet from '@/components/common/ConnectWallet'
import NetworkSelector from '@/components/common/NetworkSelector'
import SafeTokenWidget, { getSafeTokenAddress } from '@/components/common/SafeTokenWidget'
import NotificationCenter from '@/components/notification-center/NotificationCenter'
import useChainId from '@/hooks/useChainId'
import SafeLogo from '@/public/logo.svg'

type HeaderProps = {
  onMenuToggle: () => void
}

const Header = ({ onMenuToggle }: HeaderProps): ReactElement => {
  const chainId = useChainId()
  const showSafeToken = !!getSafeTokenAddress(chainId)

  return (
    <Paper className={css.container}>
      <div className={classnames(css.element, css.menuButton)}>
        <IconButton onClick={onMenuToggle} size="large" edge="start" color="default" aria-label="menu">
          <MenuIcon />
        </IconButton>
      </div>

      <div className={classnames(css.element, css.hideMobile, css.logo)}>
        <SafeLogo alt="Safe Logo" height={29} />
      </div>

      <div className={classnames(css.element, css.hideMobile)}>
        <ChainSwitcher />
      </div>

      {showSafeToken && (
        <div className={classnames(css.element, css.hideMobile)}>
          <SafeTokenWidget />
        </div>
      )}

      <div className={classnames(css.element, css.hideMobile)}>
        <NotificationCenter />
      </div>

      <div className={css.element}>
        <ConnectWallet />
      </div>

      <div className={classnames(css.element, css.networkSelector)}>
        <NetworkSelector />
      </div>
    </Paper>
  )
}

export default Header