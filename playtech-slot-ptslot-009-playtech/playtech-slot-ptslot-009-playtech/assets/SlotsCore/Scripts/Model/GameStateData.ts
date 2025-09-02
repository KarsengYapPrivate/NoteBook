import { _decorator, Component, Enum, Game, Node } from 'cc';
const { ccclass, property } = _decorator;


export enum GameOrientation {
    horizontal,
    vertical
}


export enum GameState {
    pre_initialize, // only use as default value and should not be used else where
    initialize,     // called by game master once game enter on load
    login,          // called once initialize complete
    idle,           // repeatable state 
    spin,           // repeatable state 
    result,         // repeatable state 
}


export enum GameStateAction {
    enter,
    exit,
}


export enum GameType {
    normal_game,
    free_game,
    bonus_game,
}


export enum GameSpinType {
    normal_spin,
    auto_normal_spin,
    turbo_spin,
    auto_turbo_spin,
}


export enum GameNetworkRequestEvent {
    // ========================
    // Socket Response
    // ========================
    slot_spin = "slot-spin",
}


export enum GameNetworkResponseEvent {
    // ========================
    // API Response
    // ========================
    history_report_error = "history_report_error",
    history_report = "history_report",
    init_translate = "init_translate",


    // ========================
    // Socket Response
    // ========================
    slot_result = "slot_result",
    balance = "balance",
    slot_reel_symbols = "slot_reel_symbols",
    on_subscribe_done = "on_subscribe_done",
    reset_jackpot = "reset_jackpot",
    player_balance = "player_balance",
    jackpot_balance = "jackpot_balance",
    hit_jackpot = "hit_jackpot",
    on_free_spin_selection = "on_free_spin_selection",
    gamble_result = "gamble_result",
    slot_progress = "slot_progress",
    slot_bet_success = "slot_bet_success",
    on_Custom_Feature_Data = 'on_Custom_Feature_Data',


    // ========================
    // Error
    // ========================
    server_error = "server_error",
}


export enum GameStateEvent {
    
    // ========================
    // Game State Update
    // ========================
    game_state_changed = "game_state_changed",
    game_state_presenter_completed = "game_state_presenter_completed",
    
    // ========================
    // Load Asset
    // ========================
    load_asset_start = "load_asset_start", // fire from loading screen
    load_asset_completed = "load_asset_completed", // fire from loading screen
    load_asset_update_progress = "load_asset_update_progress", // for additional asset loading to include into loading progress
    
    // ========================
    // Main Game
    // ========================
    game_initialize = "game_initialize",
    reel_started_spin = "reel_started_spin",
    reel_stopped_spin = "reel_stopped_spin",
    all_reel_started_spin = "all_reel_started_spin",
    all_reel_stopped_spin = "all_reel_stopped_spin",

    buy_freespin = "buy_freespin",

    popup_error_message = "popup_error_message",
    popup_message = "popup_message",
    close_popup_message = "close_popup_message",

    play_audio = "play_audio",
    stop_audio = "stop_audio",
    check_sound_mute = "check_sound_mute",
    auto_spin_button_clicked = "auto_spin_button_clicked",
    set_auto_spin = "set_auto_spin",
    remaining_auto_spin_number = "remaining_auto_spin_number",
    game_free_spin_transition_enter = "game_free_spin_transition_enter",
    game_free_spin_transition_exit = "game_free_spin_transition_exit",

    exit_to_lobby = "exit_to_lobby",
    logout_from_game = "logout_from_game",
    open_history = "open_history",
    open_support = "open_support",
    open_cashier = "open_cashier",

    keyboard_key_clicked = "keyboard_key_clicked",
    line_bet_changed = "line_bet_changed",

    orientation_changed = "orientation_changed",
    reset_spin_button = "reset_spin_button",

    pasue_auto_play = "pasue_auto_play",
}

export enum UIButtonEvent {
    // UIStateEvent cannot assign string value because it will not show in editor
    
    none, // default value, should not be used
    close_start_overlay_clicked, 
    spin_clicked,
    turboMode_clicked,
    autoSpin_clicked,
    increase_lineBet_clicked,
    decrease_lineBet_clicked,
    increase_line_clicked,
    decrease_line_clicked,
    open_buy_free_spin_panel_clicked,
    close_buy_free_spin_panel_clicked,
    buy_free_spin_clicked,
    confirm_buy_free_spin_clicked,
    cancel_buy_free_spin_clicked,
    menu_clicked,
    sound_clicked,
    rule_page_clicked,
    rule_page_close_clicked,
    spin_stop_clicked,
    increase_buy_free_spin_bet_clicked,
    decrease_buy_free_spin_bet_clicked,
    open_menu_panel_clicked,
    close_menu_panel_clicked,
    fullscreen_clicked,
    exit_game_button_clicked, // exit to lobby
    confirm_exit_game_button_clicked,
    cancel_exit_game_button_clicked,
    auto_page_close_clicked,
    auto_spin_amount_button_clicked,
    auto_spin_start_button_clicked,
    history_button_clicked,
    support_button_clicked,
    logout_button_clicked, 
    cashier_button_clicked,
    start_game_button_clicked,
    debug_open_menu_panel_clicked,
    debug_close_menu_panel_clicked,
    debug_normal_play_clicked,
    debug_big_win_clicked,
    debug_free_spin_clicked,
    debug_clear_clicked,
    bet_setting_ui_clicked,
}

export enum LabelEvent {

    // for jackpot, win amount, etc...
    none,
    label_win_result,
    label_total_bet,
    label_buy_free_spin_amount,
    label_jackpot_max,
    label_jackpot_minor,
    label_line_bet_amount,
    label_player_balance,
    label_free_spin_remaining,
    label_free_spin_total_win,
    label_buy_free_spin_bet_amount,
    label_auto_spin_remaining_amount,
}
