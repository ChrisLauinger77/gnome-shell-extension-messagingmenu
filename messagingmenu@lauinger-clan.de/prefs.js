const ExtensionUtils = imports.misc.extensionUtils;
const { Gtk, Gdk, GObject, Gio, Adw } = imports.gi;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain("messagingmenu");
const _ = Gettext.gettext;

//only here to be catched by translation
const strFix1 = _("Notification Color (RGB):");

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

function _page1(builder) {
  let email_setting_switch = builder.get_object("email_setting_switch");
  settings.bind(
    "notify-email",
    email_setting_switch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );
  let chat_setting_switch = builder.get_object("chat_setting_switch");
  settings.bind(
    "notify-chat",
    chat_setting_switch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );
  let mblogging_setting_switch = builder.get_object("mblogging_setting_switch");
  settings.bind(
    "notify-mblogging",
    mblogging_setting_switch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );
  let color_setting_button = builder.get_object("color_setting_button");
  let mycolor = new Gdk.RGBA();
  mycolor.parse(settings.get_string("color-rgba"));
  color_setting_button.set_rgba(mycolor);
  color_setting_button.connect("color-set", function (color_setting_button) {
    settings.set_string(
      "color-rgba",
      color_setting_button.get_rgba().to_string()
    );
  });
}

function _fillgroup(group, applist) {
  for (let app of applist) {
    let adwrow = new Adw.ActionRow({ title: app });
    group.add(adwrow);
  }
}

function _pages(builder) {
  let apps = settings.get_string("compatible-emails").split(";");
  let group = builder.get_object("messagingmenu_group_email");
  _fillgroup(group, apps);

  apps = settings.get_string("compatible-chats").split(";");
  group = builder.get_object("messagingmenu_group_chat");
  _fillgroup(group, apps);

  apps = settings.get_string("compatible-mblogs").split(";");
  group = builder.get_object("messagingmenu_group_mblog");
  _fillgroup(group, apps);

  apps = settings.get_string("compatible-hidden-email-notifiers").split(";");
  group = builder.get_object("messagingmenu_group_emailnotifiers");
  _fillgroup(group, apps);

  apps = settings.get_string("compatible-hidden-mblog-notifiers").split(";");
  group = builder.get_object("messagingmenu_group_mblognotifiers");
  _fillgroup(group, apps);
}

// used starting with GNOME 42
function fillPreferencesWindow(window) {
  let builder = Gtk.Builder.new();
  builder.add_from_file(Me.path + "/prefs.ui");
  let page1 = builder.get_object("messagingmenu_page_settings");
  window.add(page1);
  let page2 = builder.get_object("messagingmenu_page_email");
  window.add(page2);
  let page3 = builder.get_object("messagingmenu_page_chat");
  window.add(page3);
  let page4 = builder.get_object("messagingmenu_page_mblog");
  window.add(page4);
  let page5 = builder.get_object("messagingmenu_page_notifiers");
  window.add(page5);
  _page1(builder);
  _pages(builder);
}

function init() {
  ExtensionUtils.initTranslations("messagingmenu");
  settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.messagingmenu"
  );
}
