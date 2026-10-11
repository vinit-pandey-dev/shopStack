package com.example.ecommerce.rag;

public final class VectorMath {

    private VectorMath() {}


    public static float[] normalize(float[] v) {
        double sum = 0;
        for (float x : v) sum += (double) x * x;
        double norm = Math.sqrt(sum);
        if (norm > 0) {
            for (int i = 0; i < v.length; i++) v[i] = (float) (v[i] / norm);
        }
        return v;
    }

    public static double dot(float[] a, float[] b) {
        int n = Math.min(a.length, b.length);
        double s = 0;
        for (int i = 0; i < n; i++) s += (double) a[i] * b[i];
        return s;
    }
}
