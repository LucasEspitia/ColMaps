import { transformAsync } from '@babel/core';
import linker from '@angular/compiler-cli/linker/babel';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    {
      name: 'taiga-charts-linker',
      async transform(code, id) {
        if (!id.replaceAll('\\', '/').includes('/@taiga-ui/addon-charts/')) {
          return;
        }

        // Link partial Angular declarations before Vitest evaluates the chart module.
        return transformAsync(code, {
          filename: id,
          configFile: false,
          babelrc: false,
          plugins: [linker],
          sourceMaps: true,
        });
      },
    },
  ],
  test: {
    server: {
      deps: { inline: [/@taiga-ui\/addon-charts/] },
    },
  },
});
