import React from 'react'

import _, { messages } from 'intl'
import ActionButton from 'action-button'
import ActionRowButton from 'action-row-button'
import Component from 'base-component'
import Copiable from 'copiable'
import Icon from 'icon'
import renderXoItem, { Network, Sr } from 'render-xo-item'
import SelectFiles from 'select-files'
import TabButton from 'tab-button'
import Tooltip from 'tooltip'
import Upgrade from 'xoa-upgrade'
import { addSubscriptions, connectStore } from 'utils'
import { Container, Row, Col } from 'grid'
import { CustomFields } from 'custom-fields'
import { injectIntl } from 'react-intl'
import { forEach, isEmpty, map, values } from 'lodash'
import { SelectSr } from 'select-objects'
import { Text, XoSelect } from 'editable'
import { Toggle } from 'form'
import {
  createGetObject,
  createGetObjectsOfType,
  createGroupBy,
  createCollectionWrapper,
  createSelector,
} from 'selectors'
import {
  editPool,
  enableHa,
  disableHa,
  installSupplementalPackOnAllHosts,
  isSrWritable,
  rollingPoolReboot,
  setDefaultSr,
  setHostsMultipathing,
  setPoolMaster,
  setRemoteSyslogHost,
  setRemoteSyslogHosts,
  subscribePlugins,
  synchronizeNetbox,
} from 'xo'
import { SelectSuspendSr } from 'select-suspend-sr'
import { confirm } from '../../common/modal'
import { isAdmin } from '../../common/selectors'
import { ENTERPRISE, getXoaPlan } from '../../common/xoa-plans'

@connectStore(() => ({
  master: createGetObjectsOfType('host').find((_, { pool }) => ({
    id: pool.master,
  })),
}))
class PoolMaster extends Component {
  _getPoolMasterPredicate = host => host.$pool === this.props.pool.id

  _onChange = host => setPoolMaster(host)

  render() {
    const { pool, master } = this.props

    return (
      <XoSelect onChange={this._onChange} predicate={this._getPoolMasterPredicate} value={pool.master} xoType='host'>
        {master.name_label}
      </XoSelect>
    )
  }
}

@connectStore(() => ({
  defaultSr: createGetObject((_, { pool }) => pool.default_SR),
}))
class SelectDefaultSr extends Component {
  render() {
    const { defaultSr, pool } = this.props

    return (
      <XoSelect onChange={setDefaultSr} value={defaultSr} xoType='SR' predicate={sr => sr.$pool === pool.id}>
        {defaultSr !== undefined ? <Sr id={defaultSr.id} /> : _('noValue')}
      </XoSelect>
    )
  }
}

class EnableHaModal extends Component {
  state = {
    srs: Object.values(this.props.srs),
  }

  get value() {
    return this.state.srs
  }
  render() {
    return (
      <div>
        <strong>{_('poolHaSelectSrs')}</strong>
        <br />
        {_('poolHaSelectSrsDetails')}
        <SelectSr
          multi
          value={this.state.srs}
          onChange={srs => this.setState({ srs: srs.map(sr => sr.id) })}
          predicate={sr => sr.shared && isSrWritable(sr) && sr.$poolId === this.props.pool.id}
        />
      </div>
    )
  }
}

class ToggleHa extends Component {
  // state.busy is used to prevent interaction with toggle while HA is being enabled or disabled
  state = {
    busy: false,
  }

  _onChange = async value => {
    if (value) {
      const haSrs = await confirm({
        body: <EnableHaModal srs={this.props.pool.haSrs ?? []} pool={this.props.pool} />,
        title: _('poolEnableHa'),
        icon: 'pool',
      })

      try {
        this.setState({ busy: true })
        await enableHa({
          pool: this.props.pool,
          heartbeatSrs: haSrs,
          configuration: this.props.pool.ha_configuration ?? {},
        })
      } finally {
        this.setState({ busy: false })
      }
    } else {
      await confirm({
        title: _('poolDisableHa'),
        body: _('poolDisableHaConfirm'),
      })
      try {
        this.setState({ busy: true })
        await disableHa(this.props.pool)
      } finally {
        this.setState({ busy: false })
      }
    }
  }

  render() {
    return <Toggle value={this.props.pool.HA_enabled} onChange={this._onChange} disabled={this.state.busy} />
  }
}

@injectIntl
@connectStore(() => {
  const getHosts = createGetObjectsOfType('host')
    .filter((_, { pool }) => ({ $pool: pool.id }))
    .sort()
  return {
    backupNetwork: createGetObject((_, { pool }) => pool.otherConfig['xo:backupNetwork']),
    dcScopeVms: createGetObjectsOfType('VM').filter([vm => vm.other['xo:dcscope:installTime'] !== undefined]),
    dcNetScopeVms: createGetObjectsOfType('VM').filter([vm => vm.other['xo:dcnetscope:installTime'] !== undefined]),
    hosts: getHosts,
    hostsByMultipathing: createGroupBy(
      getHosts,
      () =>
        ({ multipathing }) =>
          multipathing ? 'enabled' : 'disabled'
    ),
    gpuGroups: createGetObjectsOfType('gpuGroup')
      .filter((_, { pool }) => ({ $pool: pool.id }))
      .sort(),
    isAdmin,
    migrationNetwork: createGetObject((_, { pool }) => pool.otherConfig['xo:migrationNetwork']),
  }
})
@addSubscriptions({
  plugins: subscribePlugins,
})
export default class TabAdvanced extends Component {
  _getNetworkPredicate = createSelector(
    createCollectionWrapper(
      createSelector(
        () => this.props.pifs,
        pifs => {
          const networkIds = new Set()
          pifs.forEach(pif => {
            if (pif.ip !== '') {
              networkIds.add(pif.$network)
            }
          })
          return networkIds
        }
      )
    ),
    networkIds => network => networkIds.has(network.id)
  )

  _getLatestVmIp = (vms, product) => {
    if (isEmpty(vms)) {
      return
    }

    const getInstallTime = vm => vm.other[`xo:${product}:installTime`]

    let latestVm
    Object.values(vms).forEach(vm => {
      if (vm.mainIpAddress !== undefined && (latestVm === undefined || getInstallTime(vm) > getInstallTime(latestVm))) {
        latestVm = vm
      }
    })

    return latestVm && latestVm.mainIpAddress
  }

  _getDcScopeIp = createSelector(
    () => this.props.dcScopeVms,
    dcScopeVms => this._getLatestVmIp(dcScopeVms, 'dcscope')
  )

  _getDcNetScopeIp = createSelector(
    () => this.props.dcNetScopeVms,
    dcNetScopeVms => this._getLatestVmIp(dcNetScopeVms, 'dcnetscope')
  )

  _isNetboxPluginLoaded = createSelector(
    () => this.props.plugins,
    plugins => plugins !== undefined && plugins.some(plugin => plugin.name === 'netbox' && plugin.loaded)
  )

  _onChangeAutoPoweron = value => editPool(this.props.pool, { auto_poweron: value })

  _onChangeMigrationCompression = value => editPool(this.props.pool, { migrationCompression: value })

  _onChangeBackupNetwork = backupNetwork => editPool(this.props.pool, { backupNetwork: backupNetwork.id })

  _removeBackupNetwork = () => editPool(this.props.pool, { backupNetwork: null })

  _onChangeMigrationNetwork = migrationNetwork => editPool(this.props.pool, { migrationNetwork: migrationNetwork.id })

  _removeMigrationNetwork = () => editPool(this.props.pool, { migrationNetwork: null })

  _onChangeCrashDumpSr = sr => editPool(this.props.pool, { crashDumpSr: sr.id })

  _onRemoveCrashDumpSr = () => editPool(this.props.pool, { crashDumpSr: null })

  _setRemoteSyslogHosts = () =>
    setRemoteSyslogHosts(this.props.hosts, this.state.syslogDestination).then(() =>
      this.setState({ editRemoteSyslog: false, syslogDestination: '' })
    )

  _getCrashDumpSrPredicate = createSelector(
    () => this.props.pool,
    pool => sr => isSrWritable(sr) && sr.$pool === pool.id
  )

  render() {
    const { backupNetwork, hosts, gpuGroups, pool, hostsByMultipathing, migrationNetwork } = this.props
    const { state } = this
    const { editRemoteSyslog } = state
    const { enabled: hostsEnabledMultipathing, disabled: hostsDisabledMultipathing } = hostsByMultipathing
    const { crashDumpSr } = pool
    const crashDumpSrPredicate = this._getCrashDumpSrPredicate()
    const isEnterprisePlan = getXoaPlan().value >= ENTERPRISE.value
    const isMigrationCompressionAvailable = pool.migrationCompression !== undefined

    const dcScopeIp = this._getDcScopeIp()
    const dcNetScopeIp = this._getDcNetScopeIp()

    return (
      <div>
        <Container>
          <Row>
            <Col className='text-xs-right'>
              {dcScopeIp === undefined ? (
                <TabButton
                  btnStyle='warning'
                  icon='deploy'
                  handler={() => {}}
                  labelId='deployDcScope'
                  redirectOnSuccess='/hub/recipes'
                />
              ) : (
                <TabButton
                  btnStyle='success'
                  handler={() => window.open(`https://${dcScopeIp}`)}
                  icon='telemetry'
                  labelId='dcScope'
                />
              )}
              {dcNetScopeIp === undefined ? (
                <TabButton
                  btnStyle='warning'
                  icon='deploy'
                  handler={() => {}}
                  labelId='deployDcNetScope'
                  redirectOnSuccess='/hub/recipes'
                />
              ) : (
                <TabButton
                  btnStyle='success'
                  handler={() => window.open(`https://${dcNetScopeIp}`)}
                  icon='telemetry'
                  labelId='dcNetScope'
                />
              )}
              <TabButton
                btnStyle='warning'
                handler={rollingPoolReboot}
                handlerParam={pool}
                icon='pool-rolling-reboot'
                labelId='rollingPoolReboot'
                disabled={!isEnterprisePlan}
                tooltip={!isEnterprisePlan ? _('onlyAvailableToEnterprise') : undefined}
              />
              {this._isNetboxPluginLoaded() && (
                <TabButton
                  btnStyle='primary'
                  handler={synchronizeNetbox}
                  handlerParam={[pool]}
                  icon='refresh'
                  labelId='syncNetbox'
                />
              )}
            </Col>
          </Row>
          <Row>
            <Col>
              <h3>{_('xenSettingsLabel')}</h3>
              <table className='table'>
                <tbody>
                  <tr>
                    <th>{_('autoPowerOn')}</th>
                    <td>
                      <Toggle value={pool.auto_poweron} onChange={this._onChangeAutoPoweron} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('migrationCompression')}</th>
                    <td>
                      <Tooltip
                        content={isMigrationCompressionAvailable ? undefined : _('migrationCompressionDisabled')}
                      >
                        <Toggle
                          value={pool.migrationCompression}
                          onChange={this._onChangeMigrationCompression}
                          disabled={!isMigrationCompressionAvailable}
                        />
                      </Tooltip>
                    </td>
                  </tr>
                  <tr>
                    <th>{_('poolHeartbeatSr')}</th>
                    <td>
                      <ul>
                        {map(pool.haSrs, sr => (
                          <li key={sr}>
                            <Sr id={sr} />
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <th>{_('poolHaStatus')}</th>
                    <td>
                      <ToggleHa pool={pool} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('setpoolMaster')}</th>
                    <td>
                      <PoolMaster pool={pool} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('customFields')}</th>
                    <td>
                      <CustomFields object={pool.id} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('syslogRemoteHost')}</th>
                    <td>
                      <ul className='pl-0'>
                        {map(hosts, host => (
                          <li key={host.id}>
                            <span>{`${host.name_label}: `}</span>
                            <Text
                              value={host.logging.syslog_destination || ''}
                              onChange={value => setRemoteSyslogHost(host, value)}
                            />
                          </li>
                        ))}
                      </ul>
                      <ActionRowButton
                        btnStyle={editRemoteSyslog ? 'info' : 'primary'}
                        handler={this.toggleState('editRemoteSyslog')}
                        icon='edit'
                      >
                        {_('poolEditAll')}
                      </ActionRowButton>
                      {editRemoteSyslog && (
                        <form id='formRemoteSyslog' className='form-inline mt-1'>
                          <div className='form-group'>
                            <input
                              className='form-control'
                              onChange={this.linkState('syslogDestination')}
                              placeholder={this.props.intl.formatMessage(messages.poolRemoteSyslogPlaceHolder)}
                              type='text'
                              value={state.syslogDestination}
                            />
                          </div>
                          <div className='form-group ml-1'>
                            <ActionButton
                              btnStyle='primary'
                              form='formRemoteSyslog'
                              handler={this._setRemoteSyslogHosts}
                              icon='save'
                            >
                              {_('confirmOk')}
                            </ActionButton>
                          </div>
                        </form>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>{_('defaultSr')}</th>
                    <td>
                      <SelectDefaultSr pool={pool} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('suspendSr')}</th>
                    <td>
                      <SelectSuspendSr pool={pool} />
                    </td>
                  </tr>
                  <tr>
                    <th>{_('crashDumpSr')}</th>
                    <td>
                      <XoSelect
                        onChange={this._onChangeCrashDumpSr}
                        predicate={crashDumpSrPredicate}
                        value={crashDumpSr}
                        xoType='SR'
                      >
                        {crashDumpSr !== undefined ? <Sr id={crashDumpSr} /> : _('noValue')}
                      </XoSelect>{' '}
                      {crashDumpSr !== undefined && (
                        <a onClick={this._onRemoveCrashDumpSr} role='button'>
                          <Icon icon='remove' />
                        </a>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Container>
        <h3 className='mt-1 mb-1'>{_('poolGpuGroups')}</h3>
        <Container>
          <Row>
            <Col size={9}>
              <ul className='list-group'>
                {map(gpuGroups, gpuGroup => (
                  <li key={gpuGroup.id} className='list-group-item'>
                    {renderXoItem(gpuGroup)}
                  </li>
                ))}
              </ul>
            </Col>
          </Row>
        </Container>
        <h3 className='mt-1 mb-1'>{_('multipathing')}</h3>
        <div>
          <ActionButton
            btnStyle='success'
            data-hosts={hostsDisabledMultipathing}
            data-multipathing
            disabled={hostsDisabledMultipathing === undefined}
            handler={setHostsMultipathing}
            icon='host'
          >
            {_('enableAllHostsMultipathing')}
          </ActionButton>{' '}
          <ActionButton
            btnStyle='danger'
            data-hosts={hostsEnabledMultipathing}
            data-multipathing={false}
            disabled={hostsEnabledMultipathing === undefined}
            handler={setHostsMultipathing}
            icon='host'
          >
            {_('disableAllHostsMultipathing')}
          </ActionButton>
        </div>
        <h3 className='mt-1 mb-1'>{_('supplementalPackPoolNew')}</h3>
        <Upgrade place='poolSupplementalPacks' required={2}>
          <SelectFiles onChange={file => installSupplementalPackOnAllHosts(pool, file)} />
        </Upgrade>
        <h3 className='mt-1 mb-1'>{_('miscLabel')}</h3>
        <Container>
          <Row>
            <Col>
              <table className='table'>
                <tbody>
                  <tr>
                    <th>{_('defaultMigrationNetwork')}</th>
                    <td>
                      <XoSelect
                        onChange={this._onChangeMigrationNetwork}
                        predicate={this._getNetworkPredicate()}
                        value={migrationNetwork}
                        xoType='network'
                      >
                        {pool.otherConfig['xo:migrationNetwork'] === undefined ? (
                          _('noValue')
                        ) : migrationNetwork !== undefined ? (
                          <Network id={migrationNetwork.id} />
                        ) : (
                          <span className='text-danger'>
                            {_('updateMissingNetwork', {
                              networkID: (
                                <Copiable data={pool.otherConfig['xo:migrationNetwork']}>
                                  <strong>{pool.otherConfig['xo:migrationNetwork']}</strong>
                                </Copiable>
                              ),
                            })}
                          </span>
                        )}
                      </XoSelect>{' '}
                      {pool.otherConfig['xo:migrationNetwork'] !== undefined && (
                        <a role='button' onClick={this._removeMigrationNetwork}>
                          <Icon icon='remove' />
                        </a>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th>{_('backupNetwork')}</th>
                    <td>
                      <XoSelect
                        onChange={this._onChangeBackupNetwork}
                        predicate={this._getNetworkPredicate()}
                        value={backupNetwork}
                        xoType='network'
                      >
                        {pool.otherConfig['xo:backupNetwork'] === undefined ? (
                          _('noValue')
                        ) : backupNetwork !== undefined ? (
                          <Network id={backupNetwork.id} />
                        ) : (
                          <span className='text-danger'>
                            {_('updateMissingNetwork', {
                              networkID: (
                                <Copiable data={pool.otherConfig['xo:backupNetwork']}>
                                  <strong>{pool.otherConfig['xo:backupNetwork']}</strong>
                                </Copiable>
                              ),
                            })}
                          </span>
                        )}
                      </XoSelect>{' '}
                      {pool.otherConfig['xo:backupNetwork'] !== undefined && (
                        <a role='button' onClick={this._removeBackupNetwork}>
                          <Icon icon='remove' />
                        </a>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Container>
      </div>
    )
  }
}
