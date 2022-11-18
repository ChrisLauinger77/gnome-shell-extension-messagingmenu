const ExtensionUtils = imports.misc.extensionUtils;
const { Gtk, Gdk, GObject, Gio } = imports.gi;
try {
  const { Adw } = imports.gi;
} catch (err) {
  logError(err, "messagingmenu");
}

const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain("messagingmenu");
const _ = Gettext.gettext;

//only here to be catched by translation
const strFix1 = _("Notification Color (RGB):");

let settings;
let builder;
var filechooser;

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

function _addMenuChangeDesc(cmb_add, group_add) {
  if (cmb_add.get_active() < 3) {
    group_add.set_description(
      _("Name of .desktop files without .desktop ending")
    );
  } else {
    group_add.set_description(_("Notifier title"));
  }
}

function _addMenu(cmb_add, entry_add) {
  if (entry_add.text == "") {
    return false;
  }
  let strsettings;
  let strgroup;
  switch (cmb_add.get_active_id()) {
    case "email":
      strsettings = "compatible-emails";
      strgroup = "messagingmenu_group_email";
      break;
    case "chat":
      strsettings = "compatible-chats";
      strgroup = "messagingmenu_group_chat";
      break;
    case "microblogging":
      strsettings = "compatible-mblogs";
      strgroup = "messagingmenu_group_mblog";
      break;
    case "emailnotifier":
      strsettings = "compatible-hidden-email-notifiers";
      strgroup = "messagingmenu_group_emailnotifiers";
      break;
    case "microbloggingnotifier":
      strsettings = "compatible-hidden-mblog-notifiers";
      strgroup = "messagingmenu_group_mblognotifiers";
      break;
    default:
      log("_addMenu did not find get_active_id");
  }
  let valuesettings = settings.get_string(strsettings);
  if (!valuesettings.toLowerCase().includes(entry_add.text.toLowerCase())) {
    settings.set_string(strsettings, valuesettings + ";" + entry_add.text);
    let group = builder.get_object(strgroup);
    let adwrow = new Adw.ActionRow({ title: entry_add.text });
    group.add(adwrow);
  }
}

function _onBtnClicked(btn) {
  let parent = btn.get_root();
  this.filechooser.set_transient_for(parent);

  let desktopFileFilter = new Gtk.FileFilter();
  this.filechooser.set_filter(desktopFileFilter);
  desktopFileFilter.add_pattern("*.desktop");

  this.filechooser.title = _("Select desktop file");

  this.filechooser.show();
}

function _getFilename(fullPath) {
  return fullPath.replace(/^.*[\\\/]/, "");
}

function _onFileChooserResponse(native, response) {
  if (response !== Gtk.ResponseType.ACCEPT) {
    return;
  }
  let fileURI = native.get_file().get_uri().replace("file://", "");

  let entry_add = builder.get_object("entry_add_menu_name");
  entry_add.text = _getFilename(fileURI).replace(".desktop", "");
}

function _page1() {
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
  let group_add = builder.get_object("messagingmenu_group_add");
  let cmb_add = builder.get_object("messagingmenu_cmb_add");
  cmb_add.set_active(0);
  cmb_add.connect(
    "changed",
    this._addMenuChangeDesc.bind(this, cmb_add, group_add)
  );
  let button_add = builder.get_object("button_add_menu_add");
  let entry_add = builder.get_object("entry_add_menu_name");
  button_add.connect("clicked", this._addMenu.bind(this, cmb_add, entry_add));

  let adwrow = builder.get_object("messagingmenu_row_add2");
  let buttonfilechooser = new Gtk.Button({
    label: _("..."),
    valign: Gtk.Align.CENTER,
  });
  adwrow.add_suffix(buttonfilechooser);
  adwrow.activatable_widget = buttonfilechooser;
  buttonfilechooser.connect(
    "clicked",
    this._onBtnClicked.bind(this, buttonfilechooser)
  );
  this.filechooser = new Gtk.FileChooserNative({
    title: _("Select desktop file for ") + cmb_add.get_active_id,
    modal: true,
    action: Gtk.FileChooserAction.OPEN,
  });
  this.filechooser.connect("response", this._onFileChooserResponse.bind(this));
}

function _fillgroup(group, applist) {
  for (let app of applist) {
    let adwrow = new Adw.ActionRow({ title: app });
    group.add(adwrow);
  }
}

function _pages() {
  let apps = settings.get_string("compatible-emails").split(";").sort();
  let group = builder.get_object("messagingmenu_group_email");
  _fillgroup(group, apps);

  apps = settings.get_string("compatible-chats").split(";").sort();
  group = builder.get_object("messagingmenu_group_chat");
  _fillgroup(group, apps);

  apps = settings.get_string("compatible-mblogs").split(";").sort();
  group = builder.get_object("messagingmenu_group_mblog");
  _fillgroup(group, apps);

  apps = settings
    .get_string("compatible-hidden-email-notifiers")
    .split(";")
    .sort();
  group = builder.get_object("messagingmenu_group_emailnotifiers");
  _fillgroup(group, apps);

  apps = settings
    .get_string("compatible-hidden-mblog-notifiers")
    .split(";")
    .sort();
  group = builder.get_object("messagingmenu_group_mblognotifiers");
  _fillgroup(group, apps);
}

// used starting with GNOME 42
function fillPreferencesWindow(window) {
  window.set_default_size(675, 700);
  builder = Gtk.Builder.new();
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
  _page1();
  _pages();
}

function init() {
  ExtensionUtils.initTranslations("messagingmenu");
  settings = ExtensionUtils.getSettings(
    "org.gnome.shell.extensions.messagingmenu"
  );
}
