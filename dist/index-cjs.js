'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

exports.reloader = reloader;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgtY2pzLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY2xpZW50LmNvZGUuanMiLCIuLi9zcmMvY3RDbGllbnQuY29kZS5qcyIsIi4uL3NyYy9pbmRleC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCBcIihmdW5jdGlvbiAoKSB7XFxuICAndXNlIHN0cmljdCc7XFxuXFxuICAvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cXG4gIC8qIGdsb2JhbHMgY2hyb21lICovXFxuXFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcXVvdGVzXFxuICBjb25zdCBsb2FkTWVzc2FnZSA9IGAlTE9BRF9NRVNTQUdFJWA7XFxuXFxuICAvLyBMb2cgbG9hZCBtZXNzYWdlIHRvIGJyb3dzZXIgZGV2IGNvbnNvbGVcXG4gIGNvbnNvbGUubG9nKGxvYWRNZXNzYWdlKTtcXG5cXG4gIGxldCB0aW1lc3RhbXA7XFxuXFxuICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcXG4gICAgZmV0Y2goJyVUSU1FU1RBTVBfUEFUSCUnKVxcbiAgICAgIC50aGVuKCh7IGJvZHkgfSkgPT4ge1xcbiAgICAgICAgY29uc3QgcmVhZGVyID0gYm9keS5nZXRSZWFkZXIoKTtcXG5cXG4gICAgICAgIHJldHVybiByZWFkZXIucmVhZCgpXFxuICAgICAgfSlcXG4gICAgICAudGhlbigoeyB2YWx1ZSB9KSA9PiB7XFxuICAgICAgICByZXR1cm4gbmV3IFRleHREZWNvZGVyKCd1dGYtOCcpLmRlY29kZSh2YWx1ZSlcXG4gICAgICB9KVxcbiAgICAgIC50aGVuKCh0KSA9PiB7XFxuICAgICAgICBpZiAoIXRpbWVzdGFtcCkge1xcbiAgICAgICAgICB0aW1lc3RhbXAgPSB0O1xcbiAgICAgICAgfSBlbHNlIGlmICh0aW1lc3RhbXAgIT09IHQpIHtcXG4gICAgICAgICAgY2hyb21lLnJ1bnRpbWUucmVsb2FkKCk7XFxuICAgICAgICB9XFxuICAgICAgfSlcXG4gICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XFxuICAgICAgICBjbGVhckludGVydmFsKGlkKTtcXG5cXG4gICAgICAgIGNvbnN0IGVycm9ycyA9IGxvY2FsU3RvcmFnZS5jaHJvbWVFeHRlbnNpb25SZWxvYWRlciB8fCAwO1xcblxcbiAgICAgICAgLy8gU2hvdWxkIHJlbG9hZCBhdCBsZWFzdCBvbmNlIGlmIGZldGNoIGZhaWxzXFxuICAgICAgICAvLyAtIGlmIGZldGNoIGZhaWxzLCB0aGUgdGltZXN0YW1wIGZpbGUgaXMgYWJzZW50LFxcbiAgICAgICAgLy8gICBzbyB0aGUgZXh0ZW5zaW9uIGNvZGUgd2lsbCBiZSBkaWZmZXJlbnRcXG4gICAgICAgIGlmIChlcnJvcnMgPCA1KSB7XFxuICAgICAgICAgIGxvY2FsU3RvcmFnZS5jaHJvbWVFeHRlbnNpb25SZWxvYWRlciA9IGVycm9ycyArIDE7XFxuXFxuICAgICAgICAgIGNocm9tZS5ydW50aW1lLnJlbG9hZCgpO1xcbiAgICAgICAgfSBlbHNlIHtcXG4gICAgICAgICAgY29uc29sZS5sb2coJ0FVVE8tUkVMT0FERVIgRVJST1I6Jyk7XFxuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xcbiAgICAgICAgfVxcbiAgICAgIH0pO1xcbiAgfSwgMTAwMCk7XFxuXFxufSgpKTtcXG5cIjsiLCJleHBvcnQgZGVmYXVsdCBcIihmdW5jdGlvbiAoKSB7XFxuICAndXNlIHN0cmljdCc7XFxuXFxuICAvKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cXG4gIC8qIGdsb2JhbHMgY2hyb21lICovXFxuXFxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgcXVvdGVzXFxuICBjb25zdCBsb2FkTWVzc2FnZSA9IGAlTE9BRF9NRVNTQUdFJWA7XFxuXFxuICAvLyBMb2cgbG9hZCBtZXNzYWdlIHRvIGJyb3dzZXIgZGV2IGNvbnNvbGVcXG4gIGNvbnNvbGUubG9nKGxvYWRNZXNzYWdlKTtcXG5cXG4gIGNvbnN0IHsgbmFtZSB9ID0gY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKTtcXG5cXG4gIGNvbnN0IHJlbG9hZCA9ICgpID0+IHtcXG4gICAgY29uc29sZS5sb2coYCR7bmFtZX0gaGFzIHJlbG9hZGVkLi4uYCk7XFxuXFxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xcbiAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xcbiAgICB9LCA1MDApO1xcbiAgfTtcXG5cXG4gIHNldEludGVydmFsKCgpID0+IHtcXG4gICAgdHJ5IHtcXG4gICAgICBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpO1xcbiAgICB9IGNhdGNoIChlcnJvcikge1xcbiAgICAgIGlmIChlcnJvci5tZXNzYWdlID09PSAnRXh0ZW5zaW9uIGNvbnRleHQgaW52YWxpZGF0ZWQuJykge1xcbiAgICAgICAgcmVsb2FkKCk7XFxuICAgICAgfVxcbiAgICB9XFxuICB9LCAxMDAwKTtcXG5cXG59KCkpO1xcblwiOyIsImltcG9ydCBiZ0NsaWVudENvZGUgZnJvbSAnLi9jbGllbnQuY29kZSdcbmltcG9ydCBjdENsaWVudENvZGUgZnJvbSAnLi9jdENsaWVudC5jb2RlJ1xuXG5jb25zdCBuYW1lID0gJ1BlcnNpc3RlbnQgcmVsb2FkZXInXG5cbmNvbnN0IGxvYWRNZXNzYWdlID0gYFxuREVWRUxPUE1FTlQgYnVpbGQgd2l0aCBwZXJzaXN0ZW50IGF1dG8tcmVsb2FkZXIuXG5Mb2FkZWQgb24gJHtuZXcgRGF0ZSgpLnRvVGltZVN0cmluZygpfS5cbmAudHJpbSgpXG5cbmNvbnN0IHRpbWVzdGFtcFBhdGggPSAnYXNzZXRzL3RpbWVzdGFtcC5qcydcblxuZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZGVyKCkge1xuICBjb25zdCBzdGF0ZSA9IHt9XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lLFxuXG4gICAgc3RhcnRSZWxvYWRlcihvcHRpb25zLCBidW5kbGUsIHNldFNob3VsZFN0YXJ0KSB7XG4gICAgICBzZXRTaG91bGRTdGFydChmYWxzZSlcbiAgICB9LFxuXG4gICAgY3JlYXRlQ2xpZW50RmlsZXMob3B0aW9ucywgYnVuZGxlKSB7XG4gICAgICBjb25zdCBlbWl0ID0gKG5hbWUsIGNvZGUpID0+IHtcbiAgICAgICAgY29uc3QgaWQgPSB0aGlzLmVtaXRBc3NldChuYW1lLCBjb2RlKVxuXG4gICAgICAgIHJldHVybiB0aGlzLmdldEFzc2V0RmlsZU5hbWUoaWQpXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpbWVzdGFtcEZpbGUgPSB7XG4gICAgICAgIGZpbGVOYW1lOiB0aW1lc3RhbXBQYXRoLFxuICAgICAgICBpc0Fzc2V0OiB0cnVlLFxuICAgICAgICBzb3VyY2U6IGBleHBvcnQgZGVmYXVsdCAke0RhdGUubm93KCl9YCxcbiAgICAgIH1cblxuICAgICAgYnVuZGxlW3RpbWVzdGFtcFBhdGhdID0gdGltZXN0YW1wRmlsZVxuXG4gICAgICBzdGF0ZS5iZ1NjcmlwdFBhdGggPSBlbWl0KFxuICAgICAgICAnYmctcmVsb2FkZXItY2xpZW50LmpzJyxcbiAgICAgICAgYmdDbGllbnRDb2RlXG4gICAgICAgICAgLnJlcGxhY2UoJyVUSU1FU1RBTVBfUEFUSCUnLCB0aW1lc3RhbXBQYXRoKVxuICAgICAgICAgIC5yZXBsYWNlKCclTE9BRF9NRVNTQUdFJScsIGxvYWRNZXNzYWdlKSxcbiAgICAgIClcblxuICAgICAgc3RhdGUuY3RTY3JpcHRQYXRoID0gZW1pdChcbiAgICAgICAgJ2N0LXJlbG9hZGVyLWNsaWVudC5qcycsXG4gICAgICAgIGN0Q2xpZW50Q29kZS5yZXBsYWNlKCclTE9BRF9NRVNTQUdFJScsIGxvYWRNZXNzYWdlKSxcbiAgICAgIClcbiAgICB9LFxuXG4gICAgdXBkYXRlTWFuaWZlc3Qob3B0aW9ucywgYnVuZGxlLCBfc3RhdGUgPSBzdGF0ZSkge1xuICAgICAgY29uc3QgbWFuaWZlc3RLZXkgPSAnbWFuaWZlc3QuanNvbidcbiAgICAgIGNvbnN0IG1hbmlmZXN0U291cmNlID0gYnVuZGxlW21hbmlmZXN0S2V5XS5zb3VyY2VcblxuICAgICAgaWYgKCFtYW5pZmVzdFNvdXJjZSkge1xuICAgICAgICB0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoXG4gICAgICAgICAgYGJ1bmRsZS4ke21hbmlmZXN0S2V5fSBpcyB1bmRlZmluZWRgLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hbmlmZXN0ID0gSlNPTi5wYXJzZShtYW5pZmVzdFNvdXJjZSlcblxuICAgICAgbWFuaWZlc3QuZGVzY3JpcHRpb24gPSBsb2FkTWVzc2FnZVxuXG4gICAgICBpZiAoIW1hbmlmZXN0LmJhY2tncm91bmQpIHtcbiAgICAgICAgbWFuaWZlc3QuYmFja2dyb3VuZCA9IHt9XG4gICAgICB9XG5cbiAgICAgIG1hbmlmZXN0LmJhY2tncm91bmQucGVyc2lzdGVudCA9IHRydWVcblxuICAgICAgY29uc3QgeyBzY3JpcHRzOiBiZ1NjcmlwdHMgPSBbXSB9ID0gbWFuaWZlc3QuYmFja2dyb3VuZFxuXG4gICAgICBpZiAoX3N0YXRlLmJnU2NyaXB0UGF0aCkge1xuICAgICAgICBtYW5pZmVzdC5iYWNrZ3JvdW5kLnNjcmlwdHMgPSBbXG4gICAgICAgICAgX3N0YXRlLmJnU2NyaXB0UGF0aCxcbiAgICAgICAgICAuLi5iZ1NjcmlwdHMsXG4gICAgICAgIF1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQmFja2dyb3VuZCBwYWdlIHJlbG9hZGVyIHNjcmlwdCB3YXMgbm90IGVtaXR0ZWQnLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgY29udGVudF9zY3JpcHRzOiBjdFNjcmlwdHMgPSBbXSB9ID0gbWFuaWZlc3RcblxuICAgICAgaWYgKF9zdGF0ZS5jdFNjcmlwdFBhdGgpIHtcbiAgICAgICAgbWFuaWZlc3QuY29udGVudF9zY3JpcHRzID0gY3RTY3JpcHRzLm1hcChcbiAgICAgICAgICAoeyBqcyA9IFtdLCAuLi5yZXN0IH0pID0+ICh7XG4gICAgICAgICAgICBqczogW19zdGF0ZS5jdFNjcmlwdFBhdGgsIC4uLmpzXSxcbiAgICAgICAgICAgIC4uLnJlc3QsXG4gICAgICAgICAgfSksXG4gICAgICAgIClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ29udGVudCBwYWdlIHJlbG9hZGVyIHNjcmlwdCB3YXMgbm90IGVtaXR0ZWQnLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIGJ1bmRsZVttYW5pZmVzdEtleV0uc291cmNlID0gSlNPTi5zdHJpbmdpZnkoXG4gICAgICAgIG1hbmlmZXN0LFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIDIsXG4gICAgICApXG4gICAgfSxcblxuICAgIGFzeW5jIHJlbG9hZENsaWVudHMoKSB7XG4gICAgICAvLyBSZWxvYWRlciBpcyBhY3RpdmUsIHNvIG5vIG5lZWQgdG8gZG8gYW55dGhpbmdcbiAgICB9LFxuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLG1CQUFlLDh2Q0FBOHZDOztBQ0E3d0MsbUJBQWUsc3BCQUFzcEI7OzBxQkFBQywxcUJDR3RxQixNQUFNLElBQUksR0FBRyxzQkFBcUI7O0FBRWxDLE1BQU0sV0FBVyxHQUFHLENBQUM7O1VBRVgsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3RDLENBQUMsQ0FBQyxJQUFJLEdBQUU7O0FBRVIsTUFBTSxhQUFhLEdBQUcsc0JBQXFCOztBQUUzQyxBQUFPLFNBQVMsUUFBUSxHQUFHO0VBQ3pCLE1BQU0sS0FBSyxHQUFHLEdBQUU7O0VBRWhCLE9BQU87SUFDTCxJQUFJOztJQUVKLGFBQWEsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGNBQWMsRUFBRTtNQUM3QyxjQUFjLENBQUMsS0FBSyxFQUFDO0tBQ3RCOztJQUVELGlCQUFpQixDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUU7TUFDakMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLO1FBQzNCLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMs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
