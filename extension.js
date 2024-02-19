/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const ExtensionUtils = imports.misc.extensionUtils;

const { GObject, St, Soup, Clutter } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const Me = ExtensionUtils.getCurrentExtension();

const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, `${Me.metadata.name} Indicator`, false);

      this.label = new St.Label({
        text: _("Loading..."),
        style_class: "bitcoin",
        x_align: Clutter.ActorAlign.CENTER,
        y_align: Clutter.ActorAlign.CENTER,
      });

      this.add_child(this.label);

      this._updatePrice();
    }

    async _updatePrice() {
      try {
        let httpSession = new Soup.Session();
        let message = Soup.Message.new("GET", COINGECKO_API_URL);

        httpSession.queue_message(message, (_, res) => {
          let data = res.response_body.data;
          let response = JSON.parse(data);
          let bitcoinUsd = response.bitcoin.usd;
          // let bitcoinEur = response.bitcoin.eur;
          // let ethereumUsd = response.ethereum.usd;
          // let ethereumEur = response.ethereum.eur;
          this.label.set_text(`BTC/U$D: ${bitcoinUsd}`);
          // this.label.set_text(`BTC/EUR: ${bitcoinEur}`);
          // this.label.set_text(`ETH/U$D: ${ethereumUsd}`);
          // this.label.set_text(`ETH/EUR: ${ethereumEur}`);
        });
      } catch (e) {
        logError(e, "Failed to fetch Bitcoin price");
      }
    }
  }
);

class Extension {
  constructor(uuid) {
    this._uuid = uuid;
  }

  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this._uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}

function init(meta) {
  return new Extension(meta.uuid);
}
