/**
 * Utilitario para crear tema de ECharts usando design tokens del sistema
 * 
 * IMPORTANTE: Este archivo mapea los tokens del sistema de diseño
 * a las propiedades de configuración de Apache ECharts.
 * 
 * NO usar valores hardcodeados. Siempre referenciar tokens del tema.
 */

export const createEchartsTheme = (theme) => {
  // Verificar que tenemos acceso al tema
  if (!theme || !theme.colors) {
    console.warn('⚠️ Tema no disponible, usando fallback');
    return {};
  }

  return {
    color: [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
      theme.colors.success,
      theme.colors.warning,
      theme.colors.danger,
      theme.colors.info
    ],
    backgroundColor: theme.colors.background || '#ffffff',
    textStyle: {
      fontFamily: theme.typography?.fontFamily || 'system-ui',
      fontSize: theme.typography?.fontSize?.base || 14,
      color: theme.colors.textPrimary || '#333333'
    },
    title: {
      textStyle: {
        color: theme.colors.textPrimary,
        fontWeight: theme.typography?.fontWeight?.bold || 600,
        fontSize: theme.typography?.fontSize?.xl || 18
      },
      subtextStyle: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography?.fontSize?.sm || 12
      }
    },
    line: {
      itemStyle: {
        borderWidth: 2
      },
      lineStyle: {
        width: 2
      },
      symbolSize: 6,
      symbol: 'circle',
      smooth: false
    },
    radar: {
      itemStyle: {
        borderWidth: 2
      },
      lineStyle: {
        width: 2
      },
      symbolSize: 6,
      symbol: 'circle',
      smooth: false
    },
    bar: {
      itemStyle: {
        barBorderWidth: 0,
        barBorderColor: theme.colors.border || '#e0e0e0'
      }
    },
    pie: {
      itemStyle: {
        borderWidth: 1,
        borderColor: theme.colors.background || '#ffffff'
      }
    },
    scatter: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      }
    },
    boxplot: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      }
    },
    parallel: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      }
    },
    sankey: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      }
    },
    funnel: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      }
    },
    gauge: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      }
    },
    candlestick: {
      itemStyle: {
        color: theme.colors.success,
        color0: theme.colors.danger,
        borderColor: theme.colors.success,
        borderColor0: theme.colors.danger,
        borderWidth: 1
      }
    },
    graph: {
      itemStyle: {
        borderWidth: 0,
        borderColor: theme.colors.border || '#e0e0e0'
      },
      lineStyle: {
        width: 1,
        color: theme.colors.textTertiary || '#aaaaaa'
      },
      symbolSize: 6,
      symbol: 'circle',
      smooth: false,
      color: [
        theme.colors.primary,
        theme.colors.secondary,
        theme.colors.accent
      ],
      label: {
        color: theme.colors.background || '#ffffff'
      }
    },
    map: {
      itemStyle: {
        areaColor: theme.colors.surfaceLight || '#f5f5f5',
        borderColor: theme.colors.border || '#e0e0e0',
        borderWidth: 0.5
      },
      label: {
        color: theme.colors.textPrimary
      },
      emphasis: {
        itemStyle: {
          areaColor: theme.colors.primaryLight || '#e3f2fd',
          borderColor: theme.colors.primary,
          borderWidth: 1
        },
        label: {
          color: theme.colors.primary
        }
      }
    },
    geo: {
      itemStyle: {
        areaColor: theme.colors.surfaceLight || '#f5f5f5',
        borderColor: theme.colors.border || '#e0e0e0',
        borderWidth: 0.5
      },
      label: {
        color: theme.colors.textPrimary
      },
      emphasis: {
        itemStyle: {
          areaColor: theme.colors.primaryLight || '#e3f2fd',
          borderColor: theme.colors.primary,
          borderWidth: 1
        },
        label: {
          color: theme.colors.primary
        }
      }
    },
    categoryAxis: {
      axisLine: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisLabel: {
        show: true,
        color: theme.colors.textSecondary
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: [theme.colors.surfaceLight || '#f5f5f5']
        }
      },
      splitArea: {
        show: false,
        areaStyle: {
          color: [
            'rgba(250,250,250,0.3)',
            'rgba(200,200,200,0.3)'
          ]
        }
      }
    },
    valueAxis: {
      axisLine: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisLabel: {
        show: true,
        color: theme.colors.textSecondary
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: [theme.colors.surfaceLight || '#f5f5f5']
        }
      },
      splitArea: {
        show: false,
        areaStyle: {
          color: [
            'rgba(250,250,250,0.3)',
            'rgba(200,200,200,0.3)'
          ]
        }
      }
    },
    logAxis: {
      axisLine: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisLabel: {
        show: true,
        color: theme.colors.textSecondary
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: [theme.colors.surfaceLight || '#f5f5f5']
        }
      },
      splitArea: {
        show: false,
        areaStyle: {
          color: [
            'rgba(250,250,250,0.3)',
            'rgba(200,200,200,0.3)'
          ]
        }
      }
    },
    timeAxis: {
      axisLine: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisTick: {
        show: true,
        lineStyle: {
          color: theme.colors.border || '#e0e0e0'
        }
      },
      axisLabel: {
        show: true,
        color: theme.colors.textSecondary
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: [theme.colors.surfaceLight || '#f5f5f5']
        }
      },
      splitArea: {
        show: false,
        areaStyle: {
          color: [
            'rgba(250,250,250,0.3)',
            'rgba(200,200,200,0.3)'
          ]
        }
      }
    },
    toolbox: {
      iconStyle: {
        borderColor: theme.colors.textTertiary || '#999999'
      },
      emphasis: {
        iconStyle: {
          borderColor: theme.colors.primary
        }
      }
    },
    legend: {
      textStyle: {
        color: theme.colors.textPrimary
      }
    },
    tooltip: {
      axisPointer: {
        lineStyle: {
          color: theme.colors.textTertiary || '#cccccc',
          width: 1
        },
        crossStyle: {
          color: theme.colors.textTertiary || '#cccccc',
          width: 1
        }
      }
    },
    timeline: {
      lineStyle: {
        color: theme.colors.primary,
        width: 1
      },
      itemStyle: {
        color: theme.colors.primary,
        borderWidth: 1
      },
      controlStyle: {
        color: theme.colors.primary,
        borderColor: theme.colors.primary,
        borderWidth: 0.5
      },
      checkpointStyle: {
        color: theme.colors.primary,
        borderColor: theme.colors.background || '#ffffff'
      },
      label: {
        color: theme.colors.textPrimary
      },
      emphasis: {
        itemStyle: {
          color: theme.colors.primary
        },
        controlStyle: {
          color: theme.colors.primary,
          borderColor: theme.colors.primary,
          borderWidth: 0.5
        },
        label: {
          color: theme.colors.primary
        }
      }
    },
    visualMap: {
      color: [
        theme.colors.danger,
        theme.colors.warning,
        theme.colors.success
      ]
    },
    dataZoom: {
      backgroundColor: 'rgba(255,255,255,0)',
      dataBackgroundColor: theme.colors.surfaceLight || '#f5f5f5',
      fillerColor: theme.colors.primaryLight || 'rgba(0,100,200,0.2)',
      handleColor: theme.colors.primary,
      handleSize: '100%',
      textStyle: {
        color: theme.colors.textPrimary
      }
    },
    markPoint: {
      label: {
        color: theme.colors.background || '#ffffff'
      },
      emphasis: {
        label: {
          color: theme.colors.background || '#ffffff'
        }
      }
    }
  };
};

/**
 * Mapeo de categorías de uso a colores del tema
 */
export const getCategoryColor = (category, theme) => {
  if (!theme || !theme.colors) {
    return '#999999'; // Fallback
  }

  const categoryMap = {
    'SIN USO': theme.colors.textTertiary || '#999999',
    'USO BAJO (<40%)': theme.colors.warning || '#ff9800',
    'USO MODERADO (40-70%)': theme.colors.info || '#2196f3',
    'USO ALTO (>70%)': theme.colors.success || '#4caf50'
  };

  return categoryMap[category] || theme.colors.textTertiary;
};
