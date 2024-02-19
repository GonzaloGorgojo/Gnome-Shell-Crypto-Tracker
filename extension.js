const ExtensionUtils = imports.misc.extensionUtils;

const { GObject, St, Soup, Clutter } = imports.gi;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Me = ExtensionUtils.getCurrentExtension();

const COINGECKO_API_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd,eur";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, `${Me.metadata.name} Indicator`, false);

      this.cryptoValues;

      this.label = new St.Label({
        text: _("Fetching crypto prices..."),
        style_class: "bitcoin",
        x_expand: true,
        x_align: Clutter.ActorAlign.START,
        y_align: Clutter.ActorAlign.CENTER,
        reactive: true,
      });

      this.add_child(this.label);

      let cryptoSubMenu = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });
      this.menu.addMenuItem(cryptoSubMenu);

      let cryptoBox = new St.BoxLayout({
        vertical: true,
      });
      cryptoSubMenu.actor.add_child(cryptoBox);

      // Bitcoin/USD
      this.bitcoinUSD = new PopupMenu.PopupSwitchMenuItem("BTC/USD", true);
      this.bitcoinUSD.connect("toggled", () => this._updateBoxDisplay());
      cryptoBox.add(this.bitcoinUSD);

      // Bitcoin/EUR
      this.bitcoinEUR = new PopupMenu.PopupSwitchMenuItem("BTC/EUR", false);
      this.bitcoinEUR.connect("toggled", () => this._updateBoxDisplay());
      cryptoBox.add(this.bitcoinEUR);

      // Ethereum/USD
      this.ethereumUSD = new PopupMenu.PopupSwitchMenuItem("ETH/USD", false);
      this.ethereumUSD.connect("toggled", () => this._updateBoxDisplay());
      cryptoBox.add(this.ethereumUSD);

      // Ethereum/EUR
      this.ethereumEUR = new PopupMenu.PopupSwitchMenuItem("ETH/EUR", false);
      this.ethereumEUR.connect("toggled", () => this._updateBoxDisplay());
      cryptoBox.add(this.ethereumEUR);

      this._updatePrice();

      this._timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300000, () => {
        this._updatePrice();
        return true; // Return true to keep the timer running
      });
    }

    async _updatePrice() {
      try {
        let httpSession = new Soup.Session();
        let message = Soup.Message.new("GET", COINGECKO_API_URL);

        httpSession.queue_message(message, (_, res) => {
          let data = res.response_body.data;
          this.cryptoValues = JSON.parse(data);
          this._updateBoxDisplay();
        });
      } catch (e) {
        logError(e, "Failed to fetch Crypto prices");
      }
    }

    async _updateBoxDisplay() {
      let bitcoinUsd = this.cryptoValues.bitcoin.usd;
      let bitcoinEur = this.cryptoValues.bitcoin.eur;
      let ethereumUsd = this.cryptoValues.ethereum.usd;
      let ethereumEur = this.cryptoValues.ethereum.eur;
      let text = "";

      if (this.bitcoinUSD.state) {
        text += `BTC/USD: ${bitcoinUsd} `;
      }
      if (this.bitcoinEUR.state) {
        text += `BTC/EUR: ${bitcoinEur} `;
      }
      if (this.ethereumUSD.state) {
        text += `ETH/USD: ${ethereumUsd} `;
      }
      if (this.ethereumEUR.state) {
        text += `ETH/EUR: ${ethereumEur} `;
      }

      if (text === "") {
        text = "No Coin Selected";
      }

      this.label.set_text(text);
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
