#include "../../sdk/anebetsu.hh"
#include <string>

std::string process_text(std::string data) {
    if (data.empty()) {
        return anebetsu::return_error("Empty file");
    }

    return anebetsu::return_text(data, "plaintext");
}

ANEBETSU_PLUGIN(&process_text)