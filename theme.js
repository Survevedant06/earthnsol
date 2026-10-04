// EarthNsol Theme Manager
(function() {
  var saved = localStorage.getItem('es-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);

  window.toggleTheme = function() {
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('es-theme', next);
    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.textContent = next === 'dark' ? '☀️' : '🌙';
      btn.title = next === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  };

  document.addEventListener('DOMContentLoaded', function() {
    var theme = localStorage.getItem('es-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle').forEach(function(btn) {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
      btn.title = theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  });
})();
