var bgClientCode = "(function () {\n  'use strict';\n\n  /* eslint-env browser */\n  /* globals chrome */\n\n  // eslint-disable-next-line quotes\n  const loadMessage = `%LOAD_MESSAGE%`;\n\n  // Log load message to browser dev console\n  console.log(loadMessage);\n\n  let timestamp;\n\n  const id = setInterval(() => {\n    fetch('%TIMESTAMP_PATH%')\n      .then(({ body }) => {\n        const reader = body.getReader();\n\n        return reader.read()\n      })\n      .then(({ value }) => {\n        return new TextDecoder('utf-8').decode(value)\n      })\n      .then((t) => {\n        if (!timestamp) {\n          timestamp = t;\n        } else if (timestamp !== t) {\n          chrome.runtime.reload();\n        }\n      })\n      .catch((error) => {\n        clearInterval(id);\n\n        const errors = localStorage.chromeExtensionReloader || 0;\n\n        // Should reload at least once if fetch fails\n        // - if fetch fails, the timestamp file is absent,\n        //   so the extension code will be different\n        if (errors < 5) {\n          localStorage.chromeExtensionReloader = errors + 1;\n\n          chrome.runtime.reload();\n        } else {\n          console.log('AUTO-RELOADER ERROR:');\n          console.error(error);\n        }\n      });\n  }, 1000);\n\n}());\n";

var ctClientCode = "(function () {\n  'use strict';\n\n  /* eslint-env browser */\n  /* globals chrome */\n\n  // eslint-disable-next-line quotes\n  const loadMessage = `%LOAD_MESSAGE%`;\n\n  // Log load message to browser dev console\n  console.log(loadMessage);\n\n  const { name } = chrome.runtime.getManifest();\n\n  const reload = () => {\n    console.log(`${name} has reloaded...`);\n\n    setTimeout(() => {\n      location.reload();\n    }, 500);\n  };\n\n  setInterval(() => {\n    try {\n      chrome.runtime.getManifest();\n    } catch (error) {\n      if (error.message === 'Extension context invalidated.') {\n        reload();\n      }\n    }\n  }, 1000);\n\n}());\n";

const name = 'Persistent reloader';

const loadMessage = `
DEVELOPMENT build with persistent auto-reloader.
Loaded on ${new Date().toTimeString()}.
`.trim();

const timestampPath = 'assets/timestamp.js';

function reloader() {
  const state = {};

  return {
    name,

    startReloader(options, bundle, setShouldStart) {
      setShouldStart(false);
    },

    createClientFiles(options, bundle) {
      const emit = (name, code) => {
        const id = this.emitAsset(name, code);

        return this.getAssetFileName(id)
      };

      const timestampFile = {
        fileName: timestampPath,
        isAsset: true,
        source: `export default ${Date.now()}`,
      };

      bundle[timestampPath] = timestampFile;

      state.bgScriptPath = emit(
        'bg-reloader-client.js',
        bgClientCode
          .replace('%TIMESTAMP_PATH%', timestampPath)
          .replace('%LOAD_MESSAGE%', loadMessage),
      );

      state.ctScriptPath = emit(
        'ct-reloader-client.js',
        ctClientCode.replace('%LOAD_MESSAGE%', loadMessage),
      );
    },

    updateManifest(options, bundle, _state = state) {
      const manifestKey = 'manifest.json';
      const manifestSource = bundle[manifestKey].source;

      if (!manifestSource) {
        throw new ReferenceError(
          `bundle.${manifestKey} is undefined`,
        )
      }

      const manifest = JSON.parse(manifestSource);

      manifest.description = loadMessage;

      if (!manifest.background) {
        manifest.background = {};
      }

      manifest.background.persistent = true;

      const { scripts: bgScripts = [] } = manifest.background;

      if (_state.bgScriptPath) {
        manifest.background.scripts = [
          _state.bgScriptPath,
          ...bgScripts,
        ];
      } else {
        throw new Error(
          'Background page reloader script was not emitted',
        )
      }

      const { content_scripts: ctScripts = [] } = manifest;

      if (_state.ctScriptPath) {
        manifest.content_scripts = ctScripts.map(
          ({ js = [], ...rest }) => ({
            js: [_state.ctScriptPath, ...js],
            ...rest,
          }),
        );
      } else {
        throw new Error(
          'Content page reloader script was not emitted',
        )
      }

      bundle[manifestKey].source = JSON.stringify(
        manifest,
        undefined,
        2,
      );
    },

    async reloadClients() {
      // Reloader is active, so no need to do anything
    },
  }
}

export { reloader };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtZXNtLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY2xpZW50LmNvZGUuanMiLCIuLi9zcmMvY3RDbGllbnQuY29kZS5qcyIsIi4uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBcIihmdW5jdGlvbiAoKSB7XFxuICAndXNlIHN0cmljdCc7XFxuXFxuICAvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cXG4gIC8qIGdsb2JhbHMgY2hyb21lICovXFxuXFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcXVvdGVzXFxuICBjb25zdCBsb2FkTWVzc2FnZSA9IGAlTE9BRF9NRVNTQUdFJWA7XFxuXFxuICAvLyBMb2cgbG9hZCBtZXNzYWdlIHRvIGJyb3dzZXIgZGV2IGNvbnNvbGVcXG4gIGNvbnNvbGUubG9nKGxvYWRNZXNzYWdlKTtcXG5cXG4gIGxldCB0aW1lc3RhbXA7XFxuXFxuICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcXG4gICAgZmV0Y2goJyVUSU1FU1RBTVBfUEFUSCUnKVxcbiAgICAgIC50aGVuKCh7IGJvZHkgfSkgPT4ge1xcbiAgICAgICAgY29uc3QgcmVhZGVyID0gYm9keS5nZXRSZWFkZXIoKTtcXG5cXG4gICAgICAgIHJldHVybiByZWFkZXIucmVhZCgpXFxuICAgICAgfSlcXG4gICAgICAudGhlbigoeyB2YWx1ZSB9KSA9PiB7XFxuICAgICAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcpLmRlY29kZSh2YWx1ZSlcXG4gICAgICB9KVxcbiAgICAgIC50aGVuKCh0KSA9PiB7XFxuICAgICAgICBpZiAoIXRpbWVzdGFtcCkge1xcbiAgICAgICAgICB0aW1lc3RhbXAgPSB0O1xcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lc3RhbXAgIT09IHQpIHtcXG4gICAgICAgICAgY2hyb21lLnJ1bnRpbWUucmVsb2FkKCk7XFxuICAgICAgICB9XFxuICAgICAgfSlcXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XFxuICAgICAgICBjbGVhckludGVydmFsKGlkKTtcXG5cXG4gICAgICAgIGNvbnN0IGVycm9ycyA9IGxvY2FsU3RvcmFnZS5jaHJvbWVFeHRlbnNpb25SZWxvYWRlciB8fCAwO1xcblxcbiAgICAgICAgLy8gU2hvdWxkIHJlbG9hZCBhdCBsZWFzdCBvbmNlIGlmIGZldGNoIGZhaWxzXFxuICAgICAgICAvLyAtIGlmIGZldGNoIGZhaWxzLCB0aGUgdGltZXN0YW1wIGZpbGUgaXMgYWJzZW50LFxcbiAgICAgICAgLy8gICBzbyB0aGUgZXh0ZW5zaW9uIGNvZGUgd2lsbCBiZSBkaWZmZXJlbnRcXG4gICAgICAgIGlmIChlcnJvcnMgPCA1KSB7XFxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5jaHJvbWVFeHRlbnNpb25SZWxvYWRlciA9IGVycm9ycyArIDE7XFxuXFxuICAgICAgICAgIGNocm9tZS5ydW50aW1lLnJlbG9hZCgpO1xcbiAgICAgICAgfSBlbHNlIHtcXG4gICAgICAgICAgY29uc29sZS5sb2coJ0FVVE8tUkVMT0FERVIgRVJST1I6Jyk7XFxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xcbiAgICAgICAgfVxcbiAgICAgIH0pO1xcbiAgfSwgMTAwMCk7XFxuXFxufSgpKTtcXG5cIjsiLCJleHBvcnQgZGVmYXVsdCBcIihmdW5jdGlvbiAoKSB7XFxuICAndXNlIHN0cmljdCc7XFxuXFxuICAvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cXG4gIC8qIGdsb2JhbHMgY2hyb21lICovXFxuXFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcXVvdGVzXFxuICBjb25zdCBsb2FkTWVzc2FnZSA9IGAlTE9BRF9NRVNTQUdFJWA7XFxuXFxuICAvLyBMb2cgbG9hZCBtZXNzYWdlIHRvIGJyb3dzZXIgZGV2IGNvbnNvbGVcXG4gIGNvbnNvbGUubG9nKGxvYWRNZXNzYWdlKTtcXG5cXG4gIGNvbnN0IHsgbmFtZSB9ID0gY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKTtcXG5cXG4gIGNvbnN0IHJlbG9hZCA9ICgpID0+IHtcXG4gICAgY29uc29sZS5sb2coYCR7bmFtZX0gaGFzIHJlbG9hZGVkLi4uYCk7XFxuXFxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xcbiAgICB9LCA1MDApO1xcbiAgfTtcXG5cXG4gIHNldEludGVydmFsKCgpID0+IHtcXG4gICAgdHJ5IHtcXG4gICAgICBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpO1xcbiAgICB9IGNhdGNoIChlcnJvcikge1xcbiAgICAgIGlmIChlcnJvci5tZXNzYWdlID09PSAnRXh0ZW5zaW9uIGNvbnRleHQgaW52YWxpZGF0ZWQuJykge1xcbiAgICAgICAgcmVsb2FkKCk7XFxuICAgICAgfVxcbiAgICB9XFxuICB9LCAxMDAwKTtcXG5cXG59KCkpO1xcblwiOyIsImltcG9ydCBiZ0NsaWVudENvZGUgZnJvbSAnLi9jbGllbnQuY29kZSdcbmltcG9ydCBjdENsaWVudENvZGUgZnJvbSAnLi9jdENsaWVudC5jb2RlJ1xuXG5jb25zdCBuYW1lID0gJ1BlcnNpc3RlbnQgcmVsb2FkZXInXG5cbmNvbnN0IGxvYWRNZXNzYWdlID0gYFxuREVWRUxPUE1FTlQgYnVpbGQgd2l0aCBwZXJzaXN0ZW50IGF1dG8tcmVsb2FkZXIuXG5Mb2FkZWQgb24gJHtuZXcgRGF0ZSgpLnRvVGltZVN0cmluZygpfS5cbmAudHJpbSgpXG5cbmNvbnN0IHRpbWVzdGFtcFBhdGggPSAnYXNzZXRzL3RpbWVzdGFtcC5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZGVyKCkge1xuICBjb25zdCBzdGF0ZSA9IHt9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuXG4gICAgc3RhcnRSZWxvYWRlcihvcHRpb25zLCBidW5kbGUsIHNldFNob3VsZFN0YXJ0KSB7XG4gICAgICBzZXRTaG91bGRTdGFydChmYWxzZSlcbiAgICB9LFxuXG4gICAgY3JlYXRlQ2xpZW50RmlsZXMob3B0aW9ucywgYnVuZGxlKSB7XG4gICAgICBjb25zdCBlbWl0ID0gKG5hbWUsIGNvZGUpID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSB0aGlzLmVtaXRBc3NldChuYW1lLCBjb2RlKVxuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEFzc2V0RmlsZU5hbWUoaWQpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpbWVzdGFtcEZpbGUgPSB7XG4gICAgICAgIGZpbGVOYW1lOiB0aW1lc3RhbXBQYXRoLFxuICAgICAgICBpc0Fzc2V0OiB0cnVlLFxuICAgICAgICBzb3VyY2U6IGBleHBvcnQgZGVmYXVsdCAke0RhdGUubm93KCl9YCxcbiAgICAgIH1cblxuICAgICAgYnVuZGxlW3RpbWVzdGFtcFBhdGhdID0gdGltZXN0YW1wRmlsZVxuXG4gICAgICBzdGF0ZS5iZ1NjcmlwdFBhdGggPSBlbWl0KFxuICAgICAgICAnYmctcmVsb2FkZXItY2xpZW50LmpzJyxcbiAgICAgICAgYmdDbGllbnRDb2RlXG4gICAgICAgICAgLnJlcGxhY2UoJyVUSU1FU1RBTVBfUEFUSCUnLCB0aW1lc3RhbXBQYXRoKVxuICAgICAgICAgIC5yZXBsYWNlKCclTE9BRF9NRVNTQUdFJScsIGxvYWRNZXNzYWdlKSxcbiAgICAgIClcblxuICAgICAgc3RhdGUuY3RTY3JpcHRQYXRoID0gZW1pdChcbiAgICAgICAgJ2N0LXJlbG9hZGVyLWNsaWVudC5qcycsXG4gICAgICAgIGN0Q2xpZW50Q29kZS5yZXBsYWNlKCclTE9BRF9NRVNTQUdFJScsIGxvYWRNZXNzYWdlKSxcbiAgICAgIClcbiAgICB9LFxuXG4gICAgdXBkYXRlTWFuaWZlc3Qob3B0aW9ucywgYnVuZGxlLCBfc3RhdGUgPSBzdGF0ZSkge1xuICAgICAgY29uc3QgbWFuaWZlc3RLZXkgPSAnbWFuaWZlc3QuanNvbidcbiAgICAgIGNvbnN0IG1hbmlmZXN0U291cmNlID0gYnVuZGxlW21hbmlmZXN0S2V5XS5zb3VyY2VcblxuICAgICAgaWYgKCFtYW5pZmVzdFNvdXJjZSkge1xuICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXG4gICAgICAgICAgYGJ1bmRsZS4ke21hbmlmZXN0S2V5fSBpcyB1bmRlZmluZWRgLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hbmlmZXN0ID0gSlNPTi5wYXJzZShtYW5pZmVzdFNvdXJjZSlcblxuICAgICAgbWFuaWZlc3QuZGVzY3JpcHRpb24gPSBsb2FkTWVzc2FnZVxuXG4gICAgICBpZiAoIW1hbmlmZXN0LmJhY2tncm91bmQpIHtcbiAgICAgICAgbWFuaWZlc3QuYmFja2dyb3VuZCA9IHt9XG4gICAgICB9XG5cbiAgICAgIG1hbmlmZXN0LmJhY2tncm91bmQucGVyc2lzdGVudCA9IHRydWVcblxuICAgICAgY29uc3QgeyBzY3JpcHRzOiBiZ1NjcmlwdHMgPSBbXSB9ID0gbWFuaWZlc3QuYmFja2dyb3VuZFxuXG4gICAgICBpZiAoX3N0YXRlLmJnU2NyaXB0UGF0aCkge1xuICAgICAgICBtYW5pZmVzdC5iYWNrZ3JvdW5kLnNjcmlwdHMgPSBbXG4gICAgICAgICAgX3N0YXRlLmJnU2NyaXB0UGF0aCxcbiAgICAgICAgICAuLi5iZ1NjcmlwdHMsXG4gICAgICAgIF1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQmFja2dyb3VuZCBwYWdlIHJlbG9hZGVyIHNjcmlwdCB3YXMgbm90IGVtaXR0ZWQnLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgY29udGVudF9zY3JpcHRzOiBjdFNjcmlwdHMgPSBbXSB9ID0gbWFuaWZlc3RcblxuICAgICAgaWYgKF9zdGF0ZS5jdFNjcmlwdFBhdGgpIHtcbiAgICAgICAgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzID0gY3RTY3JpcHRzLm1hcChcbiAgICAgICAgICAoeyBqcyA9IFtdLCAuLi5yZXN0IH0pID0+ICh7XG4gICAgICAgICAgICBqczogW19zdGF0ZS5jdFNjcmlwdFBhdGgsIC4uLmpzXSxcbiAgICAgICAgICAgIC4uLnJlc3QsXG4gICAgICAgICAgfSksXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ29udGVudCBwYWdlIHJlbG9hZGVyIHNjcmlwdCB3YXMgbm90IGVtaXR0ZWQnLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGJ1bmRsZVttYW5pZmVzdEtleV0uc291cmNlID0gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIG1hbmlmZXN0LFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIDIsXG4gICAgICApXG4gICAgfSxcblxuICAgIGFzeW5jIHJlbG9hZENsaWVudHMoKSB7XG4gICAgICAvLyBSZWxvYWRlciBpcyBhY3RpdmUsIHNvIG5vIG5lZWQgdG8gZG8gYW55dGhpbmdcbiAgICB9LFxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsbUJBQWUsOHZDQUE4dkM7O0FDQTd3QyxtQkFBZSxzcEJBQXNwQjs7MHFCQUFDLDFxQkNHdHFCLE1BQU0sSUFBSSxHQUFHLHNCQUFxQjs7QUFFbEMsTUFBTSxXQUFXLEdBQUcsQ0FBQzs7VUFFWCxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDdEMsQ0FBQyxDQUFDLElBQUksR0FBRTs7QUFFUixNQUFNLGFBQWEsR0FBRyxzQkFBcUI7O0FBRTNDLEFBQU8sU0FBUyxRQUFRLEdBQUc7RUFDekIsTUFBTSxLQUFLLEdBQUcsR0FBRTs7RUFFaEIsT0FBTztJQUNMLElBQUk7O0lBRUosYUFBYSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsY0FBYyxFQUFFO01BQzdDLGNBQWMsQ0FBQyxLQUFLLEVBQUM7S0FDdEI7O0lBRUQsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRTtNQUNqQyxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEtBQUs7UUFDM0IsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJ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
