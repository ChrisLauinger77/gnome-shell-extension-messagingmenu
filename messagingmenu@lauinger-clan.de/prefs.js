const ExtensionUtils = imports.misc.extensionUtils;
const GObject = imports.gi.GObject;
const { Gtk } = imports.gi;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain("messagingmenu");
const _ = Gettext.gettext;

let settings;

function createColorSettingWidget() {
  let hbox1 = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    margin_top: 5,
  });

  let color_setting_label = new Gtk.Label({
    label: _("Notification Color (Hex):"),
    xalign: 0,
  });

  let color_setting_string = new Gtk.Entry({
    text: settings.get_string("color"),
  });
  color_setting_string.connect("notify::text", function (entry) {
    // only save correct color hexcode
    if (entry.text.length == 7 && entry.text.charAt(0) == "#") {
      settings.set_string("color", entry.text);
    }
  });

  hbox1.prepend(color_setting_label);
  hbox1.append(color_setting_string);

  return hbox1;
}

function createNotificationSettingsWidget() {
  let vbox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
  });

  let hbox1 = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    margin_top: 5,
  });

  let email_setting_label = new Gtk.Label({
    label: _("Email Notification:"),
    xalign: 0,
  });

  let email_setting_switch = new Gtk.Switch({
    active: settings.get_boolean("notify-email"),
  });
  email_setting_switch.connect("notify::active", function (button) {
    settings.set_boolean("notify-email", button.active);
  });

  hbox1.prepend(email_setting_label);
  hbox1.append(email_setting_switch);
  vbox.append(hbox1);

  let hbox2 = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    margin_top: 5,
  });

  let chat_setting_label = new Gtk.Label({
    label: _("Chat Notification:"),
    xalign: 0,
  });

  let chat_setting_switch = new Gtk.Switch({
    active: settings.get_boolean("notify-chat"),
  });
  chat_setting_switch.connect("notify::active", function (button) {
    settings.set_boolean("notify-chat", button.active);
  });

  hbox2.prepend(chat_setting_label);
  hbox2.append(chat_setting_switch);
  vbox.append(hbox2);

  let hbox3 = new Gtk.Box({
    orientation: Gtk.Orientation.HORIZONTAL,
    spacing: 12,
    margin_top: 5,
  });

  let mblogging_setting_label = new Gtk.Label({
    label: _("Micro Blogging Notification:"),
    xalign: 0,
  });

  let mblogging_setting_switch = new Gtk.Switch({
    active: settings.get_boolean("notify-mblogging"),
  });
  mblogging_setting_switch.connect("notify::active", function (button) {
    settings.set_boolean("notify-mblogging", button.active);
  });

  hbox3.prepend(mblogging_setting_label);
  hbox3.append(mblogging_setting_switch);
  vbox.append(hbox3);

  return vbox;
}

// used until GNOME 42 (41 and before)
function buildPrefsWidget() {
  let frame = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
  });
  let vbox = new Gtk.Box({
    orientation: Gtk.Orientation.VERTICAL,
    spacing: 12,
    margin_top: 10,
  });
  let notifySettings = createNotificationSettingsWidget();
  let colorSetting = createColorSettingWidget();
  vbox.append(notifySettings);
  vbox.append(colorSetting);
  frame.append(vbox);

  return frame;
}

// used starting with GNOME 42
function fillPreferencesWindow(window) {
  let builder = Gtk.Builder.new();
  builder.add_from_file(Me.path + "/prefs.ui");
  let page = builder.get_object("messagingmenu_page");
  window.add(page);

  let email_setting_switch = builder.get_object("email_setting_switch");
  email_setting_switch.set_active(settings.get_boolean("notify-email"));
  email_setting_switch.connect("notify::active", function (button1) {
    settings.set_boolean("notify-email", button1.active);
  });
  let chat_setting_switch = builder.get_object("chat_setting_switch");
  chat_setting_switch.set_active(settings.get_boolean("notify-chat"));
  chat_setting_switch.connect("notify::active", function (button2) {
    settings.set_boolean("notify-chat", button2.active);
  });
  let mblogging_setting_switch = builder.get_object("mblogging_setting_switch");
  mblogging_setting_switch.set_active(settings.get_boolean("notify-mblogging"));
  mblogging_setting_switch.connect("notify::active", function (button3) {
    settings.set_boolean("notify-mblogging", button3.active);
  });
  let color_setting_string = builder.get_object("color_setting_string");
  color_setting_string.set_text(settings.get_string("color"));
  color_setting_string.connect("notify::text", function (entry) {
    // only save correct color hexcode
    if (entry.text.length == 7 && entry.text.charAt(0) == "#") {
      settings.set_string("color", entry.text);
    }
  });
}

function init() {
  ExtensionUtils.initTranslations("messagingmenu");
  settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.messagingmenu"
  );
}
