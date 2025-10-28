package com.minute.auth.common.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import net.minidev.json.parser.JSONParser;
import net.minidev.json.parser.ParseException;


public class ConvertUtil {

    public static Object converObjectToJsonObject(Object obj) {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        JSONParser parser = new JSONParser();
        String convertJsonString;
        Object convertObj;

        try {
            convertJsonString = mapper.writeValueAsString(obj);
            convertObj = parser.parse(convertJsonString);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }

        return convertObj;
    }

}