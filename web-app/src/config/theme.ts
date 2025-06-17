import { createTheme } from '@aws-amplify/ui-react';
import type { Theme } from '@cloudscape-design/components/theming';
import { type WebTheme } from '@aws-amplify/ui';
import * as defaultTokens from '@cloudscape-design/design-tokens';
import { Mode } from '@cloudscape-design/global-styles';

const fontFamilyBase: string = "'Helvetica Neue', Roboto, Arial, sans-serif";
function getCloudscapeTokens(colorMode: Mode): Theme['tokens'] {
  let fleetPurple: string = '#9e2896';
  let fleetBlue: string = '#007bc0';
  let fleetTurquoise: string = '#18837e';
  let fleetGreen: string = '#00884a';
  let fleetRed: string = '#ed0007';
  let fleetYellow: string = '#ffcf00';
  let fleetGray: string = '#71767c';
  if (colorMode === Mode.Dark) {
    fleetPurple = '#e48cdd';
    fleetBlue = '#56b0ff';
    fleetTurquoise = '#66b8b2';
    fleetGreen = '#5ebd82';
    fleetRed = '#ff8787';
    fleetYellow = '#ffdf95';
    fleetGray = '#a4abb3';
  }

  return {
    fontFamilyBase,
    fontFamilyMonospace: "'Fira Mono', Consolas, monospace, monospace",
    borderRadiusContainer: '0',
    borderRadiusButton: '0',
    borderRadiusDropdown: '0',
    borderRadiusInput: '0',
    borderRadiusAlert: '0',
    borderRadiusBadge: '0.5rem',
    borderRadiusItem: '0',
    borderRadiusCalendarDayFocusRing: '0',
    borderRadiusControlCircularFocusRing: '0',
    borderRadiusControlDefaultFocusRing: '0',
    borderRadiusFlashbar: '0',
    borderRadiusPopover: '0',
    borderRadiusTabsFocusRing: '0',
    borderRadiusTiles: '0',
    borderRadiusToken: '0',
    borderRadiusTutorialPanelItem: '0',
    colorBackgroundButtonPrimaryDefault: fleetBlue,
    colorBackgroundControlChecked: fleetBlue,
    colorBackgroundLayoutToggleHover: fleetGray,
    colorBackgroundLayoutToggleSelectedActive: fleetBlue,
    colorBackgroundLayoutToggleSelectedDefault: fleetBlue,
    colorBackgroundNotificationBlue: fleetBlue,
    colorBackgroundNotificationGreen: fleetGreen,
    colorBackgroundNotificationRed: fleetRed,
    colorBackgroundNotificationSeverityCritical: fleetPurple,
    colorBackgroundNotificationSeverityHigh: fleetRed,
    colorBackgroundNotificationSeverityLow: fleetYellow,
    colorBackgroundNotificationSeverityMedium: fleetYellow,
    colorBackgroundNotificationSeverityNeutral: fleetGray,
    colorBackgroundNotificationYellow: fleetYellow,
    colorBackgroundSegmentActive: fleetBlue,
    colorBorderButtonNormalDefault: fleetBlue,
    colorBorderControlDefault: fleetGray,
    colorBorderDropdownItemHover: fleetGray,
    colorBorderInputDefault: fleetGray,
    colorBorderItemFocused: fleetBlue,
    colorBorderItemSelected: fleetBlue,
    colorBorderStatusError: fleetRed,
    colorBorderStatusInfo: fleetBlue,
    colorBorderStatusSuccess: fleetGreen,
    colorBorderToggleButtonNormalPressed: fleetBlue,
    colorChartsPaletteCategorical1: fleetPurple,
    colorChartsPaletteCategorical2: fleetBlue,
    colorChartsPaletteCategorical3: fleetTurquoise,
    colorChartsPaletteCategorical4: fleetGreen,
    colorChartsPaletteCategorical5: fleetRed,
    colorChartsPaletteCategorical6: fleetYellow,
    colorChartsPaletteCategorical7: fleetGray,
    colorChartsPaletteCategorical8: '#671761',
    colorChartsPaletteCategorical9: '#005587',
    colorChartsPaletteCategorical10: '#0e5b57',
    colorChartsPaletteCategorical11: '#005f32',
    colorChartsPaletteCategorical12: '#a80003',
    colorChartsPaletteCategorical13: '#cda600',
    colorChartsPaletteCategorical14: '#4e5256',
    colorChartsPaletteCategorical15: '#e472db',
    colorChartsPaletteCategorical16: '#00a4fd',
    colorChartsPaletteCategorical17: '#54aba5',
    colorChartsPaletteCategorical18: '#4ab073',
    colorChartsPaletteCategorical19: '#ff6e6f',
    colorChartsPaletteCategorical20: '#fff',
    colorChartsPaletteCategorical21: '#979ea4',
    colorChartsPaletteCategorical22: '#791d73',
    colorChartsPaletteCategorical23: '#00629a',
    colorChartsPaletteCategorical24: '#116864',
    colorChartsPaletteCategorical25: '#006c3a',
    colorChartsPaletteCategorical26: '#be0004',
    colorChartsPaletteCategorical27: '#deb300',
    colorChartsPaletteCategorical28: '#595e62',
    colorChartsPaletteCategorical29: '#8b2284',
    colorChartsPaletteCategorical30: '#006ead',
    colorChartsPaletteCategorical31: '#147671',
    colorChartsPaletteCategorical32: '#007a42',
    colorChartsPaletteCategorical33: '#d50005',
    colorChartsPaletteCategorical34: '#eec100',
    colorChartsPaletteCategorical35: '#656a6f',
    colorChartsPaletteCategorical36: '#bd9900',
    colorChartsPaletteCategorical37: '#0088d4',
    colorChartsPaletteCategorical38: '#2e908b',
    colorChartsPaletteCategorical39: '#219557',
    colorChartsPaletteCategorical40: '#ff2124',
    colorChartsPaletteCategorical41: '#ffdf95',
    colorChartsPaletteCategorical42: '#7d8389',
    colorChartsPaletteCategorical43: '#e552da',
    colorChartsPaletteCategorical44: '#0096e8',
    colorChartsPaletteCategorical45: '#419e98',
    colorChartsPaletteCategorical46: '#37a264',
    colorChartsPaletteCategorical47: '#ff5152',
    colorChartsPaletteCategorical48: '#ffefd1',
    colorChartsPaletteCategorical49: '#8a9097',
    colorChartsPaletteCategorical50: '#000',
    colorChartsStatusCritical: fleetPurple,
    colorChartsStatusHigh: fleetRed,
    colorChartsStatusInfo: fleetBlue,
    colorChartsStatusLow: fleetTurquoise,
    colorChartsStatusMedium: fleetYellow,
    colorChartsStatusNeutral: fleetGray,
    colorChartsStatusPositive: fleetGreen,
    colorChartsThresholdInfo: fleetBlue,
    colorChartsThresholdNegative: fleetRed,
    colorChartsThresholdNeutral: fleetGray,
    colorChartsThresholdPositive: fleetGreen,
    colorForegroundControlReadOnly: fleetGray,
    colorTextAccent: fleetBlue,
    colorTextBreadcrumbCurrent: fleetGray,
    colorTextBreadcrumbIcon: fleetGray,
    colorTextButtonNormalDefault: fleetBlue,
    colorTextButtonNormalDisabled: fleetGray,
    colorTextButtonNormalHover: fleetBlue,
    colorTextButtonPrimaryDisabled: fleetGray,
    colorTextCounter: fleetGray,
    colorTextDropdownItemFilterMatch: fleetBlue,
    colorTextEmpty: fleetGray,
    colorTextFormSecondary: fleetGray,
    colorTextInputPlaceholder: fleetGray,
    colorTextLayoutToggleHover: fleetBlue,
    colorTextLinkButtonNormalDefault: fleetBlue,
    colorTextLinkDefault: fleetBlue,
    colorTextLinkHover: fleetBlue,
    colorTextSegmentHover: fleetBlue,
    colorTextStatusError: fleetRed,
    colorTextStatusInactive: fleetGray,
    colorTextStatusInfo: fleetBlue,
    colorTextStatusSuccess: fleetGreen,
    colorTextStatusWarning: fleetYellow
  };
}
const cloudscapeTokensLight: Theme['tokens'] = getCloudscapeTokens(Mode.Light);
export const cloudscapeLightTheme: Theme = {
  tokens: cloudscapeTokensLight,
  contexts: {
    header: {
      tokens: {
        colorBackgroundContainerHeader: 'transparent'
      }
    },
    'top-navigation': {
      tokens: {
        ...defaultTokens,
        ...cloudscapeTokensLight
      }
    }
  }
};

export const cloudscapeDarkTheme: Theme = {
  tokens: getCloudscapeTokens(Mode.Dark),
  contexts: {
    header: {
      tokens: {
        colorBackgroundContainerHeader: 'transparent'
      }
    }
  }
};

export const amplifyTheme: WebTheme = createTheme({
  name: 'fleetwatch',
  tokens: {
    fonts: {
      default: {
        static: fontFamilyBase,
        variable: fontFamilyBase
      }
    },
    radii: {
      medium: {
        value: '0'
      },
      large: {
        value: '0'
      },
      small: {
        value: '0'
      },
      xs: {
        value: '0'
      },
      xl: {
        value: '0'
      },
      xxl: {
        value: '0'
      },
      xxxl: {
        value: '0'
      }
    },
    colors: {
      white: '#fff',
      black: '#000',
      neutral: {
        '100': '#fff',
        '95': '#eff1f2',
        '90': '#e0e2e5',
        '85': '#d0d4d8',
        '80': '#c1c7cc',
        '75': '#b2b9c0',
        '70': '#a4abb3',
        '65': '#979ea4',
        '60': '#8a9097',
        '55': '#7d8389',
        '50': '#71767c',
        '45': '#656a6f',
        '40': '#595e62',
        '35': '#4e5256',
        '30': '#43464a',
        '25': '#383b3e',
        '20': '#2e3033',
        '15': '#232628',
        '10': '#1a1c1d',
        '5': '#101112',
        '0': '#000'
      },
      red: {
        '100': '#fff',
        '95': '#ffecec',
        '90': '#ffd9d9',
        '85': '#ffc6c6',
        '80': '#ffb2b2',
        '75': '#ff9d9d',
        '70': '#ff8787',
        '65': '#ff6e6f',
        '60': '#ff5152',
        '55': '#ff2124',
        '50': '#ed0007',
        '45': '#d50005',
        '40': '#be0004',
        '35': '#a80003',
        '30': '#920002',
        '25': '#7d0002',
        '20': '#680001',
        '15': '#540001',
        '10': '#410000',
        '5': '#2d0000',
        '0': '#000'
      },
      purple: {
        '100': '#fff',
        '95': '#f7eef6',
        '90': '#f0dcee',
        '85': '#ebcae8',
        '80': '#e8b6e3',
        '75': '#e5a2df',
        '70': '#e48cdd',
        '65': '#e472db',
        '60': '#e552da',
        '55': '#d543cb',
        '50': '#c535bc',
        '45': '#b12ea9',
        '40': '#9e2896',
        '35': '#8b2284',
        '30': '#791d73',
        '25': '#671761',
        '20': '#551151',
        '15': '#440c41',
        '10': '#340731',
        '5': '#230421',
        '0': '#000'
      },
      blue: {
        '100': '#fff',
        '95': '#e8f1ff',
        '90': '#d1e4ff',
        '85': '#b8d6ff',
        '80': '#9dc9ff',
        '75': '#7ebdff',
        '70': '#56b0ff',
        '65': '#00a4fd',
        '60': '#0096e8',
        '55': '#0088d4',
        '50': '#007bc0',
        '45': '#006ead',
        '40': '#00629a',
        '35': '#005587',
        '30': '#004975',
        '25': '#003e64',
        '20': '#003253',
        '15': '#002742',
        '10': '#001d33',
        '5': '#001222',
        '0': '#000'
      },
      teal: {
        '100': '#fff',
        '95': '#def5f3',
        '90': '#b6ede8',
        '85': '#a1dfdb',
        '80': '#8dd2cd',
        '75': '#79c5c0',
        '70': '#66b8b2',
        '65': '#54aba5',
        '60': '#419e98',
        '55': '#2e908b',
        '50': '#18837e',
        '45': '#147671',
        '40': '#116864',
        '35': '#0e5b57',
        '30': '#0a4f4b',
        '25': '#07423f',
        '20': '#053634',
        '15': '#032b28',
        '10': '#02201e',
        '5': '#011413',
        '0': '#000'
      },
      green: {
        '100': '#fff',
        '95': '#e2f5e7',
        '90': '#b8efc9',
        '85': '#9be4b3',
        '80': '#86d7a2',
        '75': '#72ca92',
        '70': '#5ebd82',
        '65': '#4ab073',
        '60': '#37a264',
        '55': '#219557',
        '50': '#00884a',
        '45': '#007a42',
        '40': '#006c3a',
        '35': '#005f32',
        '30': '#00512a',
        '25': '#004523',
        '20': '#00381b',
        '15': '#002c14',
        '10': '#00210e',
        '5': '#001507',
        '0': '#000'
      },
      yellow: {
        '100': '#fff',
        '95': '#ffefd1',
        '90': '#ffdf95',
        '85': '#ffcf00',
        '80': '#eec100',
        '75': '#deb300',
        '70': '#cda600',
        '65': '#bd9900',
        '60': '#ad8c00',
        '55': '#9e7f00',
        '50': '#8f7300',
        '45': '#806700',
        '40': '#725b00',
        '35': '#644f00',
        '30': '#564400',
        '25': '#493900',
        '20': '#3c2e00',
        '15': '#2f2400',
        '10': '#231a00',
        '5': '#171000',
        '0': '#000'
      },
      primary: {
        '100': '{colors.blue.100}',
        '95': '{colors.blue.95}',
        '90': '{colors.blue.90}',
        '85': '{colors.blue.85}',
        '80': '{colors.blue.80}',
        '75': '{colors.blue.75}',
        '70': '{colors.blue.70}',
        '65': '{colors.blue.65}',
        '60': '{colors.blue.60}',
        '55': '{colors.blue.55}',
        '50': '{colors.blue.50}',
        '45': '{colors.blue.45}',
        '40': '{colors.blue.40}',
        '35': '{colors.blue.35}',
        '30': '{colors.blue.30}',
        '25': '{colors.blue.25}',
        '20': '{colors.blue.20}',
        '15': '{colors.blue.15}',
        '10': '{colors.blue.10}',
        '5': '{colors.blue.5}',
        '0': '{colors.blue.0}'
      },
      secondary: {
        '100': '{colors.purple.100}',
        '95': '{colors.purple.95}',
        '90': '{colors.purple.90}',
        '85': '{colors.purple.85}',
        '80': '{colors.purple.80}',
        '75': '{colors.purple.75}',
        '70': '{colors.purple.70}',
        '65': '{colors.purple.65}',
        '60': '{colors.purple.60}',
        '55': '{colors.purple.55}',
        '50': '{colors.purple.50}',
        '45': '{colors.purple.45}',
        '40': '{colors.purple.40}',
        '35': '{colors.purple.35}',
        '30': '{colors.purple.30}',
        '25': '{colors.purple.25}',
        '20': '{colors.purple.20}',
        '15': '{colors.purple.15}',
        '10': '{colors.purple.10}',
        '5': '{colors.purple.5}',
        '0': '{colors.purple.0}'
      },
      overlay: {
        '0': 'rgba(113, 118, 124, 1.00)',
        '5': 'rgba(113, 118, 124, 0.95)',
        '10': 'rgba(113, 118, 124, 0.90)',
        '15': 'rgba(113, 118, 124, 0.85)',
        '20': 'rgba(113, 118, 124, 0.80)',
        '25': 'rgba(113, 118, 124, 0.75)',
        '30': 'rgba(113, 118, 124, 0.70)',
        '35': 'rgba(113, 118, 124, 0.65)',
        '40': 'rgba(113, 118, 124, 0.60)',
        '45': 'rgba(113, 118, 124, 0.55)',
        '50': 'rgba(113, 118, 124, 0.50)',
        '55': 'rgba(113, 118, 124, 0.45)',
        '60': 'rgba(113, 118, 124, 0.40)',
        '65': 'rgba(113, 118, 124, 0.35)',
        '70': 'rgba(113, 118, 124, 0.30)',
        '75': 'rgba(113, 118, 124, 0.25)',
        '80': 'rgba(113, 118, 124, 0.20)',
        '85': 'rgba(113, 118, 124, 0.15)',
        '90': 'rgba(113, 118, 124, 0.10)',
        '95': 'rgba(113, 118, 124, 0.05)',
        '100': 'rgba(113, 118, 124, 0.00)'
      },
      border: {
        primary: '{colors.neutral.40}',
        secondary: '{colors.neutral.60}',
        tertiary: '{colors.neutral.80}',
        disabled: '{colors.border.tertiary}',
        pressed: '{colors.primary.0}',
        focus: '{colors.primary.0}',
        error: '{colors.red.20}',
        info: '{colors.blue.20}',
        success: '{colors.green.20}',
        warning: '{colors.orange.20}'
      },
      background: {
        primary: '{colors.white}',
        secondary: '{colors.neutral.90}',
        tertiary: '{colors.neutral.80}',
        quaternary: '{colors.neutral.40}',
        disabled: '{colors.background.tertiary}',
        info: '{colors.blue.90}',
        warning: '{colors.orange.90}',
        error: '{colors.red.90}',
        success: '{colors.green.90}'
      },
      font: {
        primary: '{colors.neutral.0}',
        secondary: '{colors.neutral.10}',
        tertiary: '{colors.neutral.20}',
        disabled: '{colors.neutral.40}',
        inverse: '{colors.white}',
        interactive: '{colors.primary.50}',
        hover: '{colors.white}',
        focus: '{colors.white}',
        active: '{colors.white}',
        info: '{colors.blue.50}',
        warning: '{colors.yellow.85}',
        error: '{colors.red.50}',
        success: '{colors.green.50}'
      }
    },
    components: {
      button: {
        _hover: {
          backgroundColor: '{colors.primary.40}'
        },
        _active: {
          backgroundColor: '{colors.primary.40}'
        },
        _focus: {
          backgroundColor: '{colors.primary.40}'
        },
        link: {
          _hover: {
            backgroundColor: '{colors.primary.40}'
          },
          _active: {
            backgroundColor: '{colors.primary.40}'
          },
          _focus: {
            backgroundColor: '{colors.primary.40}'
          }
        },
        primary: {
          backgroundColor: '{colors.primary.50}',
          _hover: {
            backgroundColor: '{colors.primary.40}'
          },
          _active: {
            backgroundColor: '{colors.primary.40}'
          },
          _focus: {
            backgroundColor: '{colors.primary.40}'
          }
        }
      },
      authenticator: {
        modal: {
          backgroundColor: '{colors.white}'
        }
      }
    }
  },
  overrides: [
    {
      colorMode: Mode.Dark,
      tokens: {
        colors: {
          font: {
            primary: '{colors.white}',
            secondary: '{colors.neutral.100}',
            tertiary: '{colors.neutral.90}',
            inverse: '{colors.neutral.10}'
          },
          background: {
            primary: '{colors.neutral.10}',
            secondary: '{colors.neutral.20}',
            tertiary: '{colors.neutral.40}'
          },
          border: {
            primary: '{colors.neutral.60}',
            secondary: '{colors.neutral.40}',
            tertiary: '{colors.neutral.20}',
            focus: '{colors.primary.100}'
          },
          shadow: {
            primary: 'rgba(113, 118, 124, 0.25)',
            secondary: 'rgba(113, 118, 124, 0.15)',
            tertiary: 'rgba(113, 118, 124, 0.05)'
          },
          overlay: {
            '100': 'rgba(113, 118, 124, 1.00)',
            '95': 'rgba(113, 118, 124, 0.95)',
            '90': 'rgba(113, 118, 124, 0.90)',
            '85': 'rgba(113, 118, 124, 0.85)',
            '80': 'rgba(113, 118, 124, 0.80)',
            '75': 'rgba(113, 118, 124, 0.75)',
            '70': 'rgba(113, 118, 124, 0.70)',
            '65': 'rgba(113, 118, 124, 0.65)',
            '60': 'rgba(113, 118, 124, 0.60)',
            '55': 'rgba(113, 118, 124, 0.55)',
            '50': 'rgba(113, 118, 124, 0.50)',
            '45': 'rgba(113, 118, 124, 0.45)',
            '40': 'rgba(113, 118, 124, 0.40)',
            '35': 'rgba(113, 118, 124, 0.35)',
            '30': 'rgba(113, 118, 124, 0.30)',
            '25': 'rgba(113, 118, 124, 0.25)',
            '20': 'rgba(113, 118, 124, 0.20)',
            '15': 'rgba(113, 118, 124, 0.15)',
            '10': 'rgba(113, 118, 124, 0.10)',
            '5': 'rgba(113, 118, 124, 0.05)',
            '0': 'rgba(113, 118, 124, 0.00)'
          }
        },
        components: {
          button: {
            primary: {
              color: '{colors.white}',
              _hover: {
                color: '{colors.white}'
              },
              _active: {
                color: '{colors.white}'
              },
              _focus: {
                color: '{colors.white}'
              },
              _disabled: {
                color: '{colors.white}'
              },
              _loading: {
                color: '{colors.white}'
              }
            }
          },
          authenticator: {
            modal: {
              backgroundColor: '#1d232c'
            },
            router: { backgroundColor: '#1d232c' }
          }
        }
      }
    }
  ]
});
