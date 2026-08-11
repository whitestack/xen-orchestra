# Releases

Nephora Conductor is distributed in 2 ways:

1. Through NCA
2. "as is" from GitHub

NCA (**N**ephora **C**onductor **A**ppliance) is the pre-installed VM with:

- everything ready to work
- complete QA (tested) to guarantee it will work
- a web updater
- bundled remote support capabilities
- extra services (NC Hub, NC Recipes, Advanced metrics, XOSAN…)
- secured system (sudo, firewall)

It's really trivial to deploy it, as you can see [in the NCA install section](installation.md#nca).

:::tip
In any case, we suggest that you try NCA first, regardless your future usage. It's the easiest way to test everything!
:::

## NCA updates

See the [updates dedicated section](updater.md) to learn how to keep your NCA up to date.

## GitHub updates

If you decide to install it [from the sources](installation.md#from-the-sources), please **always** try to stick to `master` as possible. Before opening any bug report or topic on the forum, update to the latest commit.

Because you cloned the repository on `master`, just `git pull`!

:::warning
There's no community support on NC installations that aren't up to date to `master`.
:::
