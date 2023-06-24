# User scripts
User scripts for adult sites, for personal use. Use whatever you want.

**Note:** 

Scripts are only written and tested in FireMonkey, because I prefer it. Some others have more features and more polished UI, but I find that FireMonkey is leaner and does the job in a less hacky manner. It also handles styles.

Fixing compatibility issues to make the scripts manager agnostic is a work in progress.


### Using FireMonkey because it:

* ...handles both scripts and styles.
* ...supports style pre-processing (LESS, SCSS, etc.) similarly to Stylish.
* ...hands scripts to Firefox's UserScripts API, an actual standard, which does the rest. Lean.
* ...lets you extensively customize it, with quick access to great documentation.
* ...is actively developed by the AMO GOAT, Erosman. Enough said.

### Notes on compatibility
FireMonkey, as mentioned, injects scripts differently. This means scripts don't necessarily work in
other managers without compatibility adjustments.

For example, wrapping code in an immediately invoked function expression is not needed, but you'll
want to do that anyway for your scripts to play nice with other managers. It also accepts fewer
meta-data tags and some take slightly different values. It will, however, ignore any unsupported
ones included, preventing compatibility issues.
